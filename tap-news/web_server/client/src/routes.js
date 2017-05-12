import Base from './Base/Base';
import App from './App/App';
import LoginPage from './Login/LoginPage';
import SignUpPage from './SignUp/SignUpPage';
import ProfilePage from './Profile/ProfilePage';
import Auth from './Auth/Auth';


const routes = {
  // base component (wrapper for the whole application).
  component: Base,
  childRoutes: [

    {
      path: '/',
      getComponent: (location, callback) => {
        if (Auth.isUserAuthenticated()) {
          callback(null, App);
        } else {
          callback(null, LoginPage);
        }
      }
    },

    {
      path: '/login',
      getComponent: (location, callback) => {
          callback(null, LoginPage);
      }
    },

    {
      path: '/signup',
      getComponent: (location, callback) => {
          callback(null, SignUpPage);
      }
    },

    {
      path: '/logout',
      onEnter: (nextState, replace) => {
        Auth.deauthenticateUser();

        // change the current URL to /
        replace('/');
      }
    },
    {
      path: '/profile',
      getComponent: (location, callback) => {
        if (Auth.isUserAuthenticated()) {
          callback(null, ProfilePage);
        } else {
          callback(null, LoginPage);
        }
      }
    }
  ]
};

export default routes;
