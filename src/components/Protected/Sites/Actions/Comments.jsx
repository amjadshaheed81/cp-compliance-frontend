import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import moment from "moment";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  List, ListItem, ListItemAvatar, ListItemText, Avatar,
  Typography, TextField, Button, Paper, IconButton, Input, Divider
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { get, put, putMultiPartFormData,uploadSiteCheckDoc, getSasToken } from "../../../../api";

const EditAction = ({
  actionId,
  loggedInUserData,
  siteSelectedForGlobal,
  }) => {

  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };


  const [sasToken, setSasToken] = useState();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
 

  useEffect(() => {
    getComments();
    getToken();
  }, []);

  const getToken = async () => {
    const token = await getSasToken();
    setSasToken(token);
  }


  const getComments = async () => {
    const commentsAll = await get(`/api/site/actions/comments/${actionId}`);
    setComments(commentsAll);
  };

 
  


  const dateFormat = (date) => {
    return moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
  };


  


  const handleAddComment = async () => {
    if (newComment.trim() || selectedImage) {
      const newCommentData = {
        text: newComment,
        date: new Date().toLocaleString(),
        userId: loggedInUserData?.id,
        actionId: actionId,
        createdAt: new Date()
      };

      if (selectedImage?.name) {
        const data = {
          siteId: siteSelectedForGlobal?.siteId,
          file: selectedImage
        }
        newCommentData.image = await uploadSiteCheckDoc(data);
      }
      toast.success("Comment added successfully")
      await put("/api/site/actions/comments", newCommentData);
      setSelectedImage(null);
      getComments();
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };


  return (
    <Paper elevation={3} style={{ padding: '20px', margin: '20px auto' }}>
      <List>
        {comments.map((comment, index) => (
          <>
          <ListItem key={index} alignItems="flex-start">
            <ListItemAvatar>
              <Avatar alt={comment.user.name} src={comment.user.imgUrl} />
            </ListItemAvatar>
            <ListItemText
              primary={
                <Typography variant="h6">{comment.user.name}</Typography>
              }
              secondary={
                <>
                  <Typography variant="body2" color="textSecondary">{dateFormat(comment.createdAt)}</Typography>
                  <Typography variant="body1">{comment.text}</Typography>
                  {comment.image && (
                    <img src={comment.image+ "?" + sasToken} alt="Attached" style={{ maxWidth: '100%', marginTop: '10px' }} />
                  )}
                </>
              }
            />
          </ListItem>
           <Divider variant="inset" component="li" />
           </>
        ))}
      </List>

      <TextField
        label="Add a comment"
        variant="outlined"
        fullWidth
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        style={{ marginTop: '20px' }}
      />
      <Input
        accept="image/*"
        id="comment-image-upload"
        type="file"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />
      <label htmlFor="comment-image-upload">
        <IconButton color="primary" component="span" style={{ marginTop: '10px' }}>
          <AttachFileIcon />
        </IconButton>
        {selectedImage && <Typography variant="body2">{selectedImage.name}</Typography>}
      </label>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddComment}
        style={{ marginTop: '10px', marginLeft: '10px' }}
      >
        Add
      </Button>
    </Paper>
  );
};
  
const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, {})(EditAction);
