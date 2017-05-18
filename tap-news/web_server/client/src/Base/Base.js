import React, { PropTypes } from 'react';
import Auth from '../Auth/Auth';
import { Link } from 'react-router';
// import 'materialize-css/dist/css/materialize.css';
// window.$ = window.jQuery = require('jquery');
// var Materialize = require('materialize-css');
// import 'materialize-css/dist/js/materialize';



const Base = ({ children }) => (
  <div>
    <nav className="nav-bar indigo lighten-1">
      <div className="nav-wrapper">
        <a href="/" className="brand-logo">&nbsp;&nbsp;Tap News</a>
        <ul id="nav-mobile" className="right hide-on-med-and-down">
          {Auth.isUserAuthenticated() ?
            (<div >
               <li><Link to="/profile">{Auth.getEmail()}</Link></li>
               <li><Link to="/logout">Log out</Link></li>
             </div>)
             :
            (<div>
               <li><Link to="/login">Log in</Link></li>
               <li><Link to="/signup">Sign up</Link></li>
             </div>)
          }
        </ul>
      </div>
    </nav>
    <br/>
    {children}
  </div>
);

Base.propTypes = {
  children: PropTypes.object.isRequired
};

export default Base;
