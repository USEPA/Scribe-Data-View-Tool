import {Typography, Button, FormControl} from '@material-ui/core';
import {createStyles, withStyles, Theme} from '@material-ui/core/styles';
import {green} from '@material-ui/core/colors';

//
// Constants for texts
//


//
// Constants for custom form component styles
//
export const Header = withStyles((theme: Theme) =>
    createStyles({
        root: {
            textAlign: "center",
            lineHeight: "1",
        },
    }),
)(Typography);

export const CustomSelectControl = withStyles((theme: Theme) =>
    createStyles({
        root: {
            borderRadius: 4,
            border: '1px solid #ced4da',
            marginTop: "15px",
            marginBottom: "20px",
        },
    }),
)(FormControl);

export const SubmitBtn = withStyles({
    root: {
        color: "white",
        backgroundColor: green[900],
        '&:hover': {
            backgroundColor: green[800],
        }
    },
})(Button);


