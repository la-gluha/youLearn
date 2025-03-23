import React, { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { TextField, Button, Paper, Typography } from '@mui/material';
import YouTube from 'react-youtube';

const WebViewer = ({ blocks, handleBlockChange }) => {
  // Web Viewer 状态
  const [url, setUrl] = useState(() => localStorage.getItem('youLearn_url') || '');
  const [loadedUrl, setLoadedUrl] = useState(() => localStorage.getItem('youLearn_loadedUrl') || '');
  const [youtubeVideoId, setYoutubeVideoId] = useState(() => {
    const savedVideoId = localStorage.getItem('youLearn_youtubeVideoId');
    return savedVideoId ? savedVideoId : null;
  });
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(() => {
    const savedTime = localStorage.getItem(`youLearn_videoTime_${youtubeVideoId}`);
    return savedTime ? parseFloat(savedTime) : 0;
  });

  // 检查是否为YouTube链接并提取视频ID
  const extractYoutubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // 加载URL
  const handleLoadUrl = () => {
    if (url.trim()) {
      const videoId = extractYoutubeVideoId(url.trim());
      if (videoId) {
        // 如果视频ID变化，重置播放时间
        if (videoId !== youtubeVideoId) {
          setVideoCurrentTime(0);
        }
        setYoutubeVideoId(videoId);
        setLoadedUrl(''); // 清空普通URL，使用YouTube组件
      } else {
        setYoutubeVideoId(null);
        setLoadedUrl(url);
      }
    }
  };
  
  // YouTube播放器就绪时的回调
  const onYoutubePlayerReady = (event) => {
    setYoutubePlayer(event.target);
    // 只在首次加载或刷新页面时恢复播放位置
    if (videoCurrentTime > 0) {
      event.target.seekTo(videoCurrentTime);
    }
  };
  
  // 保存YouTube播放进度
  const saveVideoProgress = () => {
    if (youtubePlayer && youtubeVideoId) {
      const currentTime = youtubePlayer.getCurrentTime();
      setVideoCurrentTime(currentTime);
      localStorage.setItem(`youLearn_videoTime_${youtubeVideoId}`, currentTime.toString());
    }
  };
  
  // 保存Web Viewer状态到localStorage
  useEffect(() => {
    localStorage.setItem('youLearn_url', url);
  }, [url]);
  
  useEffect(() => {
    localStorage.setItem('youLearn_loadedUrl', loadedUrl);
  }, [loadedUrl]);
  
  useEffect(() => {
    if (youtubeVideoId) {
      localStorage.setItem('youLearn_youtubeVideoId', youtubeVideoId);
    } else {
      localStorage.removeItem('youLearn_youtubeVideoId');
    }
  }, [youtubeVideoId]);
  
  // 在页面刷新或关闭时保存播放进度
  useEffect(() => {
    if (youtubePlayer && youtubeVideoId) {
      // 添加页面卸载事件监听器
      const handleBeforeUnload = () => {
        saveVideoProgress();
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      // 组件卸载时移除事件监听器
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [youtubePlayer, youtubeVideoId]);
  
  // 组件卸载前保存播放进度
  useEffect(() => {
    return () => {
      saveVideoProgress();
    };
  }, [youtubePlayer, youtubeVideoId]);

  return (
    <Rnd
      className="block web-viewer"
      size={{ width: blocks.webViewer.width, height: blocks.webViewer.height }}
      position={{ x: blocks.webViewer.x, y: blocks.webViewer.y }}
      disableDragging={false}
      dragHandleClassName="block-title"
      enableResizing={{
        bottom: false,
        bottomLeft: false,
        bottomRight: true,
        left: false,
        right: false,
        top: false,
        topLeft: false,
        topRight: false
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        handleBlockChange('webViewer', position, {
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
    >
      <Paper elevation={3} className="block-content">
        <Typography variant="h6" className="block-title">Web Viewer</Typography>
        <div className="url-input-container">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="https://youtu.be/2uvysYbKdjM"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLoadUrl()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleLoadUrl}
            className="load-button"
          >
            Load
          </Button>
        </div>
        <div className="iframe-container">
          {youtubeVideoId ? (
            <YouTube 
              videoId={youtubeVideoId} 
              className="web-iframe"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 0,
                },
              }}
              onReady={onYoutubePlayerReady}
              onPause={saveVideoProgress}
              onEnd={saveVideoProgress}
            />
          ) : loadedUrl !== '' ? (
            <iframe
              src={loadedUrl}
              title="Web Viewer"
              className="web-iframe"
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="empty-iframe">
              <div className="iframe-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <path fill="currentColor" d="M11 7h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
                <p>Enter a URL above to load content</p>
              </div>
            </div>
          )}
        </div>
      </Paper>
    </Rnd>
  );
};

export default WebViewer;