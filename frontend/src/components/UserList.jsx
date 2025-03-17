import React from "react";
import { FixedSizeList as List } from "react-window";
import { Box, Avatar, Typography } from "@mui/material";

const UserListItem = ({ data, index, style }) => {
  const { users, handleUserClick, api } = data;
  const user = users[index];

  return (
    <div style={style}>
      <Box
        onClick={() => handleUserClick(user)}
        sx={{
          cursor: "pointer",
          maxHeight: "87px",
          p: "16px 10px 16px 12px",
          display: "flex",
          gap: "10px",
        }}
      >
        <Avatar
          src={`${api}/${user?.photo}`}
          sx={{ width: "44px", height: "44px", background: "#D9D9D9" }}
          loading="lazy"
        />
        <Box>
          <Typography sx={textStyles}>{user.username}</Typography>
          {user.is_group_chat && <Typography sx={subTextStyles}>Group chat</Typography>}
          <Typography sx={subTextStyles}>{user.position}</Typography>
          <Typography sx={subTextStyles}>{user.department_name}</Typography>
        </Box>
      </Box>
    </div>
  );
};

const textStyles = {
  fontSize: "16px",
  fontWeight: "400",
  color: "#000",
  width: "80%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const subTextStyles = {
  fontSize: "14px",
  fontWeight: "400",
  color: "#3C3C4399",
  width: "80%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const UserList = ({ filteredUsers, handleUserClick, api }) => {
  return (
    <Box
      sx={{
        marginTop: "4px",
        background: "#fff",
        borderRadius: "8px",
        maxHeight: "300px",
        overflow: "hidden",
      }}
    >
      <List
        height={300} 
        itemCount={filteredUsers.length}
        itemSize={87} 
        width="100%"
        itemData={{ users: filteredUsers, handleUserClick, api }} 
      >
        {UserListItem}
      </List>
    </Box>
  );
};

export default React.memo(UserList);

