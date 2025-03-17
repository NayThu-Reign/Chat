import {
    Avatar,
    Box,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,

} from "@mui/material"

import { 
    InsertDriveFile as InsertDriveFileIcon,
    Edit as EditIcon,
    PushPin as PushPinIcon,
    Delete as DeleteIcon,
    DeleteOutline as DeleteOutlineIcon,
    Reply as ReplyIcon,
    ContentCopy as ContentCopyIcon,
    MoreHoriz as MoreHorizIcon,
    Close as CloseIcon,
} from "@mui/icons-material"

import React,{ useState, useEffect, useRef } from "react";
import { useUIState } from "../providers/UIStateProvider";
import { useAuth } from "../providers/AuthProvider";
import { io } from 'socket.io-client';
import TextEditor from "../components/TextEditor";

import { format, isToday, isYesterday } from 'date-fns'
import TimeAgo from "../components/TimeAgo";
import { useLocation, useNavigate } from "react-router-dom";
import VisibilityMessages from "../components/VisibilityMessages";




export default function CreateChat() {

   
}