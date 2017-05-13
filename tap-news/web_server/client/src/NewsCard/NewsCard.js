import './NewsCard.css';
import Auth from '../Auth/Auth';

import React from 'react';

class NewsCard extends React.Component{
  //define redirectToUrl function
  redirectToUrl(e,url) {
    e.preventDefault();
    this.sendClickLog();
    this.sendClickMonitor();
    window.open(url, '_blank');
  }

  sendClickLog() {
    let Config = require('Config')
    let url = Config.serverUrl+'/news/userId/' + Auth.getEmail()
              + '/newsId/' + this.props.news.digest;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }

  sendClickMonitor() {
    console.log('send monitor data...');
    let Config = require('Config')
    let url = Config.serverUrl+'/monitor/process/'+Config.userClickMetric;

    let request = new Request(encodeURI(url), {
      method: 'POST',
      headers: {
        'Authorization': 'bearer ' + Auth.getToken(),
      },
      cache: false});

    fetch(request);
  }

  //if != null do something
  //this.props means parents' varible.
  render() {
    return(
    <div className="col s12 m12 l12 hoverable" onClick={() => this.redirectToUrl(event,this.props.news.url)}>
    <div className="card medium horizontal">
      <div className="card-image fill">
        <img src={this.props.news.urlToImage}/>
      </div>
      <div className="card-stacked">
        <div className="card-content">
          <h4>{this.props.news.title}</h4>
          <p>{this.props.news.description}</p>
        </div>
        <div className="card-action">
        <div>
          {this.props.news.reason != null && <div className='chip light-green news-chip'>{this.props.news.reason}</div>}
          {this.props.news.source != null && <div className='chip light-blue news-chip'>{this.props.news.source}</div>}
          {this.props.news.class != null && <div className='chip news-chip'>{this.props.news.class}</div>}
          {this.props.news.time != null && <div className='chip amber news-chip'>{this.props.news.time}</div>}
        </div>
        </div>
      </div>
    </div>
  </div>
);
  }
}

export default NewsCard;


// return(
//   <div className="news-container hoverable" onClick={() => this.redirectToUrl(event,this.props.news.url)}>
//     <div className='row'>
//       <div className='col s4 fill'>
//         <img src={this.props.news.urlToImage} alt='news'/>
//       </div>
//       <div className="col s8">
//         <div className="news-intro-col">
//           <div className="news-intro-panel">
//             <h4>{this.props.news.title}</h4>
//             <div className="news-description">
//               <p>{this.props.news.description}</p>
//               <div>
//                 {this.props.news.reason != null && <div className='chip light-green news-chip'>{this.props.news.reason}</div>}
//                 {this.props.news.source != null && <div className='chip light-blue news-chip'>{this.props.news.source}</div>}
//                 {this.props.news.class != null && <div className='chip news-chip'>{this.props.news.class}</div>}
//                 {this.props.news.time != null && <div className='chip amber news-chip'>{this.props.news.time}</div>}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// );
