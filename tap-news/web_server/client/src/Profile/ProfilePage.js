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
    //this.loadUserPreference();
    //this.authKibana();
    this.reloadIMG();
    //this.reloadIMGSource();
    let intervalId = setInterval(()=>{   //works
      this.reloadIMG()
      //this.reloadIMGSource()
    }, 30000, true); // 15 seconds in milliseconds

    this.setState({intervalId: intervalId});
  }

  componentWillUnmount() {
   // use intervalId from the state to clear the interval
   clearInterval(this.state.intervalId);
}


  reloadIMG(e){
    let Config = require('Config')
    let graphiteUrl = Config.graphite_server;
    //e.preventDefault();
    //console.log("Reload IMG...");
    this.setState({
      cpu24hours: graphiteUrl+'/S/O?' + new Date().getTime(),
      cpu1week: graphiteUrl+'/S/P?' + new Date().getTime(),
      cpu1hour: graphiteUrl+'/S/R?' + new Date().getTime(),
      cpu10min: graphiteUrl+'/S/S?' + new Date().getTime(),
      cpu1min: graphiteUrl+'/S/Q?' + new Date().getTime(),
      click24hours: graphiteUrl+'/S/a?' + new Date().getTime(),
      click1week: graphiteUrl+'/S/9?' + new Date().getTime(),
      click1hour: graphiteUrl+'/S/8?' + new Date().getTime(),
      click10min: graphiteUrl+'/S/7?' + new Date().getTime(),
      click1min: graphiteUrl+'/S/6?' + new Date().getTime(),
      qps24hours: graphiteUrl+'/S/X?' + new Date().getTime(),
      qps1week: graphiteUrl+'/S/Y?' + new Date().getTime(),
      qps1hour: graphiteUrl+'/S/Z?' + new Date().getTime(),
      qps10min: graphiteUrl+'/S/N?' + new Date().getTime(),
      qps1min: graphiteUrl+'/S/0?' + new Date().getTime(),
      log24hours: graphiteUrl+'/S/1?' + new Date().getTime(),
      log1week: graphiteUrl+'/S/2?' + new Date().getTime(),
      log1hour: graphiteUrl+'/S/4?' + new Date().getTime(),
      log10min: graphiteUrl+'/S/5?' + new Date().getTime(),
      log1min: graphiteUrl+'/S/3?' + new Date().getTime(),
      mem24hours: graphiteUrl+'/S/f?' + new Date().getTime(),
      mem1week: graphiteUrl+'/S/e?' + new Date().getTime(),
      mem1hour: graphiteUrl+'/S/d?' + new Date().getTime(),
      mem10min: graphiteUrl+'/S/c?' + new Date().getTime(),
      mem1min: graphiteUrl+'/S/b?' + new Date().getTime()
    })
  }

  authKibana(){
    let url="http://98.224.216.111:5601";
    let request = new Request(encodeURI(url), {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ZWxhc3RpYzpjaGFuZ2VtZQ==',
      },
      cache: false});

      fetch(request,{mode: 'no-cors'})
  }


  reloadIMGSource(){
    let Config = require('Config')
    let graphiteUrl = Config.graphiteServerUrl;
    let url = graphiteUrl+'/render/?width=586&height=308&from=-1minutes&tz=America%2FDetroit&target=stats.Click_News_Event&target=stats.Load_News_Event&format=json'
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
