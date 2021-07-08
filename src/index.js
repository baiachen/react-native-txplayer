import React, { forwardRef, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { StyleSheet, StatusBar, Image, View } from 'react-native';
import PropTypes from 'prop-types';
import { useBackHandler, useAppState, useDimensions } from '@react-native-community/hooks';


import TXViewPlayer from './TXViewPlayer';
import ControlerView from './components/ControlerView';

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: 'black',
  },
});

const Player = forwardRef(
  (
    {
      garden,
      title,
      source,
      poster,
      style,
      themeColor,
      onFullScreen,
      onCompletion,
      setAutoPlay,
      onChangeBitrate,
      onProgress,
      onPrepare,
      isLandscape,
      ...restProps
    },
    ref
  ) => {
    const playerRef = useRef();
    const [playSource, setPlaySource] = useState(source);
    const [error, setError] = useState(false);
    const [errorObj, setErrorObj] = useState({});
    const [loading, setLoading] = useState(true);
    const [isFull, setIsFull] = useState(false);
    const [isComplate, setIsComplate] = useState(false);
    const [isStopPlay, setIsStopPlay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(setAutoPlay);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(0);
    const [buffer, setBuffer] = useState(0);
    const [isStart, setIsStart] = useState(false);
    const [bitrateList, setBitrateList] = useState([]);
    const [bitrateIndex, setBitrateIndex] = useState();
    const { screen, window } = useDimensions();
    const currentAppState = useAppState();

    useImperativeHandle(ref, () => ({
      play: (play) => {
        if (play) {
          handlePlay();
        } else {
          handlePause();
        }
      },
      fullscreen: (full) => {
        if (full) {
          handleFullScreenIn();
        } else {
          handleFullScreenOut();
        }
      },
      stop: handleStop,
      seekTo: handleSlide,
    }));

    // 处理切换资源
    useEffect(() => {
      if (source) {
        changeSource(source);
      }
    }, [source]);

    useEffect(() => {
      if (currentAppState === 'background') {
        playerRef.current.pausePlay();
        setIsPlaying(false);
      }
    }, [currentAppState]);

    useBackHandler(() => {
      if (isFull) {
        handleFullScreenOut();
        return true;
      }
      return false;
    });

    const changeSource = (src) => {
      setPlaySource(src);
      setLoading(true);
      setError(false);
    };

    const handlePlay = () => {
      if (isComplate) {
        playerRef.current.restartPlay();
        setIsComplate(false);
      } else if (isStopPlay) {
        playerRef.current.reloadPlay();
      } else {
        playerRef.current.startPlay();
      }
      setIsPlaying(true);
    };

    const handlePause = () => {
      playerRef.current.pausePlay();
      setIsPlaying(false);
    };

    const handleReload = () => {
      setError(false);
      playerRef.current.reloadPlay();
    };

    const handleSlide = (value) => {
      playerRef.current.seekTo(value);
    };

    const handleStop = () => {
      playerRef.current.stopPlay();
      setIsStopPlay(true);
      setIsPlaying(false);
      setIsStart(false);
    };

    const handleFullScreenIn = () => {
      setIsFull(true);
      onFullScreen(true);
      // hideNavigationBar();
      garden.updateOptions({ statusBarHidden: true })
    };

    const handleFullScreenOut = () => {
      onFullScreen(false);
      setIsFull(false);
      garden.updateOptions({ statusBarHidden: false })
      // showNavigationBar();
    };

    const handleChangeConfig = (config) => {
      playerRef.current.setNativeProps(config);
    };

    const handleChangeBitrate = (newIndex) => {
      setLoading(true);
      setBitrateIndex(newIndex);
    };

    const isOrientationLandscape = isLandscape;

    const fullscreenStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: isOrientationLandscape
        ? Math.max(screen.width, screen.height)
        : Math.min(screen.width, screen.height),
      height: isOrientationLandscape
        ? Math.min(screen.width, screen.height)
        : Math.max(screen.width, screen.height),
      zIndex: 100,
    };

    const fullwindowStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: isOrientationLandscape
        ? Math.max(window.width, window.height)
        : Math.min(window.width, window.height),
      height: isOrientationLandscape
        ? Math.min(window.width, window.height)
        : Math.max(window.width, window.height),
    };
    return (
      <View style={[styles.base, isFull ? fullscreenStyle : style]}>
        <TXViewPlayer
          {...restProps}
          ref={playerRef}
          source={playSource}
          setAutoPlay={setAutoPlay}
          selectBitrateIndex={bitrateIndex}
          style={isFull ? fullwindowStyle : StyleSheet.absoluteFill}
          onTXVodPrepare={() => {
            if (isPlaying) {
              playerRef.current.startPlay();
            }
            setCurrent(0);
            setBuffer(0);
            onPrepare();
          }}
          onTXVodLoading={() => {
            setLoading(true);
          }}
          onTXVodLoadingEnd={() => {
            setLoading(false);
          }}
          onTXVodBegin={() => {
            setError(false);
            setLoading(false);
            setIsStopPlay(false);
            setIsPlaying(true);
            setIsStart(true);
          }}
          onTXVodProgress={({ nativeEvent }) => {
            setTotal(nativeEvent.duration);
            setCurrent(nativeEvent.progress);
            setBuffer(nativeEvent.buffered);
            onProgress(nativeEvent);
          }}
          onTXVodEnd={() => {
            setIsComplate(true);
            setIsPlaying(false);
            onCompletion();
          }}
          onTXVodError={({ nativeEvent }) => {
            setError(true);
            setErrorObj(nativeEvent);
          }}
          onTXVodBitrateChange={({ nativeEvent }) => {
            setBitrateIndex(nativeEvent.index);
            onChangeBitrate(nativeEvent);
          }}
          onTXVodBitrateReady={({ nativeEvent }) => {
            setBitrateList(nativeEvent.bitrates);
          }}
        >

          <ControlerView
            {...restProps}
            title={title}
            isFull={isFull}
            current={current}
            buffer={buffer}
            total={total}
            isError={error}
            poster={poster}
            isStart={isStart}
            isLoading={loading}
            errorObj={errorObj}
            isPlaying={isPlaying}
            loadingObj={{}}
            themeColor={themeColor}
            playSource={playSource}
            bitrateList={bitrateList}
            bitrateIndex={bitrateIndex}
            onSlide={handleSlide}
            onPressPlay={handlePlay}
            onPressPause={handlePause}
            onPressReload={handleReload}
            onPressFullIn={handleFullScreenIn}
            onPressFullOut={handleFullScreenOut}
            onChangeConfig={handleChangeConfig}
            onChangeBitrate={handleChangeBitrate}
          />
        </TXViewPlayer>
      </View>
    );
  }
);
Player.propTypes = {
  ...TXViewPlayer.propTypes,
  source: PropTypes.string, // 播放地址
  poster: Image.propTypes.source, // 封面图
  onFullScreen: PropTypes.func, // 全屏回调事件
  onCompletion: PropTypes.func, // 播放完成事件
  enableFullScreen: PropTypes.bool, // 是否允许全屏
  themeColor: PropTypes.string, // 播放器主题
  enableCast: PropTypes.bool, // 是否显示投屏按钮
  onCastClick: PropTypes.func, // 投屏按钮点击事件
  onChangeBitrate: PropTypes.func, // 切换清晰度
  onProgress: PropTypes.func, // 进度回调
  onPrepare: PropTypes.func, // 播放准备回调
  isLandscape: PropTypes.bool, // 全屏是否横屏
  // garden:
};

Player.defaultProps = {
  onFullScreen: () => {},
  onCompletion: () => {},
  onCastClick: () => {},
  onChangeBitrate: () => {},
  onProgress: () => {},
  onPrepare: () => {},
  themeColor: '#F85959',
  enableHardwareDecoder: false,
  setSpeed: 1.0,
  setRenderMode: 0,
  isLandscape: true,
};

export default React.memo(Player);
