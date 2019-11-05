
export async function submitSampleRequest(formData) {
    try {
        let response = await fetch('/api/submit_sample_request/', {
            method: 'post',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        let json = await response.json();
        return json;
    } catch (error) {
        console.error('Error:', error);
    }
}
