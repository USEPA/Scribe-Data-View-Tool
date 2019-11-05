
export const validateForm = (formId: string): boolean => {
    let formElement = document.getElementById(formId) as HTMLInputElement;
    if (formElement) {
        if (!formElement.checkValidity()) {
            // show html5 form errors
            formElement.reportValidity();
            return false;
        } else {
            return true;
        }
    }
    return false;
};
