import React, {PropTypes} from 'react';

import ProfileForm from './ProfileForm';
import Auth from '../Auth/Auth';

class ProfilePage extends React.Component{
  constructor() {
    super();
    // set the initial component state
    this.state = {
      prefer_list: null,
      ban_list: null,
      cpu24hours: null,
      cpu1week: null,
      cpu1hour: null,
      cpu10min: null,
      cpu1min: null,
      click24hours: null,
      click1week: null,
      click1hour: null,
      click10min: null,
      click1min: null,
      qps24hours: null,
      qps1week: null,
      qps1hour: null,
      qps10min: null,
      qps1min: null,
      log24hours: null,
      log1week: null,
      log1hour: null,
      log10min: null,
      log1min: null,
      mem24hours: null,
      mem1week: null,
      mem1hour: null,
      mem10min: null,
      mem1min: null,
      intervalId: null,
      img_json:null
    };

  }

// execute didMount function after constructe finished, react method
  componentDidMount() {
    // this.loadUserPreference();

    this.reloadIMG();
    this.reloadIMGSource();
    let intervalId = setInterval(()=>{   //works
      this.reloadIMG()
      this.reloadIMGSource()
    }, 15000, true); // 15 seconds in milliseconds

    this.setState({intervalId: intervalId});

  }

  componentWillUnmount() {
   // use intervalId from the state to clear the interval
   clearInterval(this.state.intervalId);
}


  reloadIMG(e){
    //e.preventDefault();
    //console.log("Reload IMG...");
    this.setState({
      cpu24hours: 'http://localhost/S/O?' + new Date().getTime(),
      cpu1week: 'http://localhost/S/P?' + new Date().getTime(),
      cpu1hour: 'http://localhost/S/R?' + new Date().getTime(),
      cpu10min: 'http://localhost/S/S?' + new Date().getTime(),
      cpu1min: 'http://localhost/S/Q?' + new Date().getTime(),
      click24hours: 'http://localhost/S/a?' + new Date().getTime(),
      click1week: 'http://localhost/S/9?' + new Date().getTime(),
      click1hour: 'http://localhost/S/8?' + new Date().getTime(),
      click10min: 'http://localhost/S/7?' + new Date().getTime(),
      click1min: 'http://localhost/S/6?' + new Date().getTime(),
      qps24hours: 'http://localhost/S/X?' + new Date().getTime(),
      qps1week: 'http://localhost/S/Y?' + new Date().getTime(),
      qps1hour: 'http://localhost/S/Z?' + new Date().getTime(),
      qps10min: 'http://localhost/S/N?' + new Date().getTime(),
      qps1min: 'http://localhost/S/0?' + new Date().getTime(),
      log24hours: 'http://localhost/S/1?' + new Date().getTime(),
      log1week: 'http://localhost/S/2?' + new Date().getTime(),
      log1hour: 'http://localhost/S/4?' + new Date().getTime(),
      log10min: 'http://localhost/S/5?' + new Date().getTime(),
      log1min: 'http://localhost/S/3?' + new Date().getTime(),
      mem24hours: 'http://localhost/S/f?' + new Date().getTime(),
      mem1week: 'http://localhost/S/e?' + new Date().getTime(),
      mem1hour: 'http://localhost/S/d?' + new Date().getTime(),
      mem10min: 'http://localhost/S/c?' + new Date().getTime(),
      mem1min: 'http://localhost/S/b?' + new Date().getTime()
    })
  }


  reloadIMGSource(){
    let url = 'http://localhost/render/?width=586&height=308&from=-1minutes&tz=America%2FDetroit&target=stats.Click_News_Event&target=stats.Load_News_Event&format=json'
    let request = new Request(encodeURI(url), {
      method: 'GET',
      headers: {
      },
      cache: false});

      fetch(request)
        .then((res) => res.json())
        .then((data)=>{
          //console.log(data);
          this.setState({img_json: JSON.stringify(data)})
        })

  }

  loadUserPreference(){
    let Config = require('Config')

    let url = Config.serverUrl + '/preference/userId/' + Auth.getEmail();

    let request = new Request(encodeURI(url), {
      method: 'GET',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});


      fetch(request)
        .then((res) => res.json())
        .then((preference) => {
        //console.log(preference);
        //const prefer_list = preference['prefer']
        //const ban_list = preference['ban']
        this.setState({
          prefer_list:preference['prefer'],
          ban_list:preference['ban']
        });

      });

  }


  render() {
    return (
      <ProfileForm
        prefer_list={this.state.prefer_list}
        ban_list={this.state.ban_list}
        cpu24hours={this.state.cpu24hours}
        cpu1week={this.state.cpu1week}
        cpu1hour={this.state.cpu1hour}
        cpu10min={this.state.cpu10min}
        cpu1min={this.state.cpu1min}
        click24hours={this.state.click24hours}
        click1week={this.state.click1week}
        click1hour={this.state.click1hour}
        click10min={this.state.click10min}
        click1min={this.state.click1min}
        qps24hours={this.state.qps24hours}
        qps1week={this.state.qps1week}
        qps1hour={this.state.qps1hour}
        qps10min={this.state.qps10min}
        qps1min={this.state.qps1min}
        log24hours={this.state.log24hours}
        log1week={this.state.log1week}
        log1hour={this.state.log1hour}
        log10min={this.state.log10min}
        log1min={this.state.log1min}
        mem24hours={this.state.mem24hours}
        mem1week={this.state.mem1week}
        mem1hour={this.state.mem1hour}
        mem10min={this.state.mem10min}
        mem1min={this.state.mem1min}
        img_json={this.state.img_json}
      />
    );
  }
}



export default ProfilePage;
