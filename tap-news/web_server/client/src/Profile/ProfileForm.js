import React, {PropTypes} from 'react';
import { Tabs, Tab, MediaBox, Collapsible, CollapsibleItem } from 'react-materialize';

const ProfileForm = ({
  prefer_list,
  ban_list,
  cpu24hours,
  cpu1week,
  cpu1hour,
  cpu10min,
  cpu1min,
  click24hours,
  click1week,
  click1hour,
  click10min,
  click1min,
  qps24hours,
  qps1week,
  qps1hour,
  qps10min,
  qps1min,
  log24hours,
  log1week,
  log1hour,
  log10min,
  log1min,
  mem24hours,
  mem1week,
  mem1hour,
  mem10min,
  mem1min,
  img_json
}) => (
  <div className="container">
    <div className="row">
      <Tabs className='tab-demo z-depth-1'>
        <Tab title="News Data Structure" active>
        <div className="video-container">
        <iframe className="col s12" height="900" src="http://98.224.216.111:5656/app/kibana#/dashboard/a3264300-38d6-11e7-9275-577cd4c56e96?embed=true&_g=(filters%3A!()%2CrefreshInterval%3A(display%3AOff%2Cpause%3A!f%2Cvalue%3A0)%2Ctime%3A(from%3Anow-60d%2Cmode%3Aquick%2Cto%3Anow))"></iframe>
        </div>
        </Tab>
        <Tab title="QPS">
        <h5>Request Per Second:</h5>
        <ul className="collapsible popout" data-collapsible="expandable">
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Minute</div>
            <div className="collapsible-body"><MediaBox alt='' src={qps1min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>10 Minutes</div>
            <div className="collapsible-body"><MediaBox alt='' src={qps10min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Hour</div>
            <div className="collapsible-body "><MediaBox alt='' src={qps1hour} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>24 Hours</div>
            <div className="collapsible-body"><MediaBox alt='' src={qps24hours} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Week</div>
            <div className="collapsible-body"><MediaBox alt='' src={qps1week} width='100%'/></div>
          </li>
        </ul>
        </Tab>
        <Tab title="User Activities">
        <h5>User Activities:</h5>
        <ul className="collapsible popout" data-collapsible="expandable">
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Minute</div>
            <div className="collapsible-body"><MediaBox alt='' src={click1min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>10 Minutes</div>
            <div className="collapsible-body"><MediaBox alt='' src={click10min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Hour</div>
            <div className="collapsible-body "><MediaBox alt='' src={click1hour} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>24 Hours</div>
            <div className="collapsible-body"><MediaBox alt='' src={click24hours} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Week</div>
            <div className="collapsible-body"><MediaBox alt='' src={click1week} width='100%'/></div>
          </li>
        </ul>
        </Tab>
        <Tab title="CPU">
        <h5>CPU:</h5>
        <ul className="collapsible popout" data-collapsible="expandable">
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Minute</div>
            <div className="collapsible-body"><MediaBox alt='' src={cpu1min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>10 Minutes</div>
            <div className="collapsible-body"><MediaBox alt='' src={cpu10min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Hour</div>
            <div className="collapsible-body "><MediaBox alt='' src={cpu1hour} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>24 Hours</div>
            <div className="collapsible-body"><MediaBox alt='' src={cpu24hours} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Week</div>
            <div className="collapsible-body"><MediaBox alt='' src={cpu1week} width='100%'/></div>
          </li>
        </ul>
        </Tab>
        <Tab title="Memory">
        <h5>Memory:</h5>
        <ul className="collapsible popout" data-collapsible="expandable">
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Minute</div>
            <div className="collapsible-body"><MediaBox alt='' src={mem1min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>10 Minutes</div>
            <div className="collapsible-body"><MediaBox alt='' src={mem10min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Hour</div>
            <div className="collapsible-body "><MediaBox alt='' src={mem1hour} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>24 Hours</div>
            <div className="collapsible-body"><MediaBox alt='' src={mem24hours} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Week</div>
            <div className="collapsible-body"><MediaBox alt='' src={mem1week} width='100%'/></div>
          </li>
        </ul>
        </Tab>
        <Tab title="System Log">
        <h5>System Log:</h5>
        <ul className="collapsible popout" data-collapsible="expandable">
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Minute</div>
            <div className="collapsible-body"><MediaBox alt='' src={log1min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>10 Minutes</div>
            <div className="collapsible-body"><MediaBox alt='' src={log10min} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Hour</div>
            <div className="collapsible-body "><MediaBox alt='' src={log1hour} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>24 Hours</div>
            <div className="collapsible-body"><MediaBox alt='' src={log24hours} width='100%'/></div>
          </li>
          <li>
            <div className="collapsible-header active"><i className="material-icons">info_outline</i>1 Week</div>
            <div className="collapsible-body"><MediaBox alt='' src={log1week} width='100%'/></div>
          </li>
        </ul>
        </Tab>
    </Tabs>
    </div>
    </div>
);

ProfileForm.propTypes = {
  prefer_list: PropTypes.object.isRequired,
  ban_list: PropTypes.object.isRequired,
  cpu24hours: PropTypes.object.isRequired,
  cpu1week: PropTypes.object.isRequired,
  cpu1hour: PropTypes.object.isRequired,
  cpu10min: PropTypes.object.isRequired,
  cpu1min: PropTypes.object.isRequired,
  click24hours: PropTypes.object.isRequired,
  click1week: PropTypes.object.isRequired,
  click1hour: PropTypes.object.isRequired,
  click10min: PropTypes.object.isRequired,
  click1min: PropTypes.object.isRequired,
  qps24hours: PropTypes.object.isRequired,
  qps1week: PropTypes.object.isRequired,
  qps1hour: PropTypes.object.isRequired,
  qps10min: PropTypes.object.isRequired,
  qps1min: PropTypes.object.isRequired,
  log24hours: PropTypes.object.isRequired,
  log1week: PropTypes.object.isRequired,
  log1hour: PropTypes.object.isRequired,
  log10min: PropTypes.object.isRequired,
  log1min: PropTypes.object.isRequired,
  mem24hours: PropTypes.object.isRequired,
  mem1week: PropTypes.object.isRequired,
  mem1hour: PropTypes.object.isRequired,
  mem10min: PropTypes.object.isRequired,
  mem1min: PropTypes.object.isRequired,
  img_json: PropTypes.object.isRequired
};

export default ProfileForm;
