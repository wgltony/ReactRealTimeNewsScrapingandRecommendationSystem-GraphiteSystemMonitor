import React, { Component } from 'react';
import logo from '../../public/logo.png';
import './App.css';
import NewsPanel from '../NewsPanel/NewsPanel.js'


class App extends Component {
  render() {
    return (
      <div>
      <img className='logo' src={logo} alt='logo' />
      <div className='container'>
        <NewsPanel/>
      </div>
      </div>
    );
  }
}

export default App;
