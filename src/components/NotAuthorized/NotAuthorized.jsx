import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Typography } from "@mui/material";

const NotAuthorized = () => {
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate("/dashboard"); // Change this to the route you want to redirect to
  };

  return (
    <Container style={{ textAlign: "center", marginTop: "50px" }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Not Authorized
      </Typography>
      <Typography variant="h6" component="p" gutterBottom>
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleRedirect}>
        Go to Login
      </Button>
    </Container>
  );
};

export default NotAuthorized;
