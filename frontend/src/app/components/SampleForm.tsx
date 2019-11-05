import * as React from "react";
import {TextField, InputLabel, NativeSelect} from '@material-ui/core';
import {CustomSelectControl, SubmitBtn} from '../../globals';
import {validateForm} from '../../helpers/utils';
import {submitSampleRequest} from '../../api/api';
import {environment} from '../../environment';

interface ISampleRequestState {
    selectedUserType: string;
}

export interface ISampleRequestProps {
    activeUserType: string;
    isRequesting: boolean;
    disabled: boolean;
}

export interface ISampleRequestFormFields {
    first_name: string;
    last_name: string;
    email: string;
    choice: string;
}

// <props, state>
export class SampleForm extends React.Component<ISampleRequestProps, ISampleRequestState> {

    constructor(props: ISampleRequestProps) {
        super(props);
        this.state = {
            selectedUserType: "",
        };
    }

    public render() {
        return (
            <form id={"sample-request-form"} noValidate onSubmit={this.handleSubmit}>
                <TextField
                    id="firstName"
                    name="firstName"
                    label="First Name"
                    type="text"
                    inputProps={{maxLength: 100}}
                    required
                    fullWidth
                    variant="outlined"
                    margin="normal"
                />
                <TextField
                    id="lastName"
                    name="lastName"
                    label="Last Name"
                    type="text"
                    inputProps={{maxLength: 100}}
                    required
                    fullWidth
                    variant="outlined"
                    margin="normal"
                />
                <TextField
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    inputProps={{maxLength: 50}}
                    required
                    autoComplete="email"
                    fullWidth
                    variant="outlined"
                    margin="normal"
                />
                <CustomSelectControl required fullWidth>
                    <InputLabel shrink={this.state.selectedUserType !== ""} htmlFor="user-customized-select"
                                style={{marginLeft: "10px"}}>
                        I like Django, React, or both?
                    </InputLabel>
                    <NativeSelect
                        value={this.state.selectedUserType}
                        inputProps={{
                            name: 'userType',
                            id: 'user-customized-select',
                        }}
                        onChange={this.toggleUserType}
                        style={{marginLeft: "10px"}}
                    >
                        <option value=""/>
                        <option value={"Django"}>Django</option>
                        <option value={"React"}>React</option>
                        <option value={"Both"}>Both</option>
                    </NativeSelect>
                </CustomSelectControl>
                <br/>
                <SubmitBtn type="submit" fullWidth>Submit</SubmitBtn>
            </form>
        );
    }

    // Event handlers callback functions
    private toggleUserType = (event: any) => {
        this.setState({selectedUserType: event.target.value});
    };

    private onChange = (value: any) => {
    };

    private handleSubmit = (event: any) => {
        event.preventDefault();
        let formElement = document.getElementById(event.target.id) as HTMLFormElement;
        let isValid = validateForm(event.target.id);
        if (isValid) {
            const formData = new FormData(event.target);
            let userData: ISampleRequestFormFields = {
                first_name: formData.get('firstName') as string,
                last_name: formData.get('lastName') as string,
                email: formData.get('email') as string,
                choice: formData.get('userType') as string
            };
            // POST Request
            let response = submitSampleRequest(userData);
            console.log(response);
            // reset form
            formElement.reset();
        }
    };

}
