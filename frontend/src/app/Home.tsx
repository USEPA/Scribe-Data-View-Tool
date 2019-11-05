import * as React from 'react';
import {Grid, Box} from '@material-ui/core';
import {SampleForm} from './components/SampleForm'

interface IAdState {
    activeUserType: string;
}

// <props, state>
class Home extends React.Component<any, IAdState> {
    constructor(props: any) {
        super(props);
        this.state = {
            activeUserType: "guest"
        };
    }

    public componentDidMount() {
        // make any initialization api calls
    }

    public render() {
        return (
            <Box>
                <Grid>
                </Grid>
            </Box>
        );
    }

    // Event handlers callback functions
    private toggleUserType = (userType: string) => (event: any) => {
        this.setState({activeUserType: userType});
    };

}

export default Home;
