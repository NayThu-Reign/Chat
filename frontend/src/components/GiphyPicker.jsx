import React, { useEffect, useState } from 'react';
import { 
  Box, 
  IconButton, 
  TextField, 
  ImageList, 
  ImageListItem, 
  Popover, 
  ButtonGroup,
  Button,
  Tooltip,
} from '@mui/material';

import {
  Search as SearchIcon,
  AddReaction as AddReactionIcon,
  Close as CloseIcon,
} from "@mui/icons-material"

export default function GiphyPicker({ onSelectGif, closePicker }) {
  const [gifs, setGifs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null); // Anchor for Popover
  const [isPickerOpen, setIsPickerOpen] = useState(false); // State to manage visibility
  const [ activeType, setActiveType ] = useState('gif');

  const fetchGifsOrStickers = async (query = '') => {
    try {
      const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
      const endpoint = query
      ? `https://api.giphy.com/v1/${activeType === 'gif' ? 'gifs' : 'stickers'}/search?api_key=${apiKey}&q=${query}&limit=20`
      : `https://api.giphy.com/v1/${activeType === 'gif' ? 'gifs' : 'stickers'}/trending?api_key=${apiKey}&limit=20`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setGifs(data.data);
      console.log("HI", data.data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
    }
  };

  useEffect(() => {
    if (isPickerOpen) fetchGifsOrStickers();
  }, [isPickerOpen, activeType]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchGifsOrStickers(searchTerm);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setIsPickerOpen((prev) => !prev);
    closePicker(); // Notify parent component to close the picker
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsPickerOpen(false);
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      <Tooltip title="Gif&Sticker"> 
        <IconButton onClick={handleClick}>
          <AddReactionIcon sx={{ fontSize: "32px", color: "#121660"}}/>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          style: {
            borderRadius: '8px',
            width: '300px',
            height: '350px',
            overflow: 'hidden',
            padding: '8px',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton
                                    size="small"
                                    onClick={handleClose}
                                    sx={{
                                        color: '#121660',
                                        "&:hover": {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    }}
                                >
                                    <CloseIcon />
                                </IconButton>
            </Box>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <IconButton onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        </Box>


        <ButtonGroup variant="outlined" fullWidth>
          <Button onClick={() => setActiveType('gif')} variant={activeType === 'gif' ? 'contained' : 'outlined'}>
            GIFs
          </Button>
          <Button onClick={() => setActiveType('sticker')} variant={activeType === 'sticker' ? 'contained' : 'outlined'}>
            Stickers
          </Button>
        </ButtonGroup>

        <Box
          sx={{
            maxHeight: '280px',
            overflowY: 'auto',
            borderRadius: '8px',
          }}
        >
          <ImageList cols={3} gap={8}>
            {gifs.map((gif) => (
              <ImageListItem 
                key={gif.id} 
                onClick={() => {
                  onSelectGif(gif.images.fixed_height.url, 'gif');
                  handleClose(); // Close the picker after selecting a GIF
                }}
              >
                <img src={gif.images.fixed_height.url} alt={gif.title} style={{ cursor: 'pointer' }} />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      </Popover>
    </Box>
  );
}


