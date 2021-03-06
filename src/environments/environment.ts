export const environment = {
  production: false,
  backend: {
    api: {
      host: 'https://localhost:8181/'
    },
    account: {
      fbLoginAndRegistrationUrl: 'https://localhost:8181/account/facebook/registration-and-login'
    }
  },
  cdn: {
    host: 'https://stack-judge-cdn-dev-eu-central-1.s3.eu-central-1.amazonaws.com/'
  }
};
