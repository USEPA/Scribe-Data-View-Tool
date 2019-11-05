import React from "react";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {Box, Container, Divider, Grid} from '@material-ui/core';
import '../styles/App.css';
import Home from './Home';
import Img from '../images/SADIE.png';

function App() {
    return (
        <Router>
            <Container className="App" style={{maxWidth: "100%", margin: 0, padding: 0}}>
                <Grid className="App-header" container direction="column" alignItems="center" justify="center">
                    <Box my={2}>
                        <img src={Img} alt=""/>
                    </Box>
                </Grid>
                <Divider/>
                <Route exact path="/" component={Home}/>
                <Divider/>
                <Grid className="App-footer" container direction="column" alignItems="center" justify="center">
                    <Box my={5}>
                        Footer
                    </Box>
                </Grid>
            </Container>
        </Router>
    );
}

export default App;
