import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

const MarkdownGuide = () => {
  return (
    <Paper 
      elevation={1} 
      sx={{ 
        padding: 2, 
        marginBottom: 2, 
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        borderLeft: '4px solid #3f51b5'
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Markdown 换行指南
      </Typography>
      <Box component="ul" sx={{ margin: 0, paddingLeft: 2 }}>
        <Typography component="li" variant="body2">
          在行末添加两个空格，然后按回车键
        </Typography>
        <Typography component="li" variant="body2">
          使用HTML标签 <code>&lt;br&gt;</code>
        </Typography>
        <Typography component="li" variant="body2">
          连续使用两个回车键创建新段落
        </Typography>
      </Box>
    </Paper>
  );
};

export default MarkdownGuide;