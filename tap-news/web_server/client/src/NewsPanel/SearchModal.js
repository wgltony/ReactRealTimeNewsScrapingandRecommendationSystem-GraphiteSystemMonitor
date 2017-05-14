import ReactModal from 'react-modal';
import React, {PropTypes} from 'react';
import { Button, Icon, Input} from 'react-materialize';

const modalStyle = {
      overlay : {
        position: 'fixed', /* Stay in place */
        left: '0',
        top: '0',
        right: 'auto',
        bottom: 'auto',
        width: '100%', /* Full width */
        height: '100%', /* Full height */
        overflow: 'auto', /* Enable scroll if needed */
        backgroundColor: 'rgba(0,0,0,0.4)' /* Black w/ opacity */

      },
      content : {
        width: '60%',
        top: '20%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)'
      }
}

const modalButton = ({
    showModal,
    handleOpenModal,
    handleCloseModal,
    inputHandler,
  }) => (
      <div>
        <Button floating waves='light' icon='search' className='blue' onClick={handleOpenModal}/>
        <ReactModal
           isOpen={showModal}
           shouldCloseOnOverlayClick={true}
           style={modalStyle}
        >
        <Button waves='light' className='right' modal='close' icon='close' flat onClick={handleCloseModal}/>
        <Input s={8} label="Search" validate onKeyPress={inputHandler} placeholder='Type anything you like...'><Icon>search</Icon></Input>
        </ReactModal>
      </div>
)

modalButton.propTypes = {
  showModal: PropTypes.func.isRequired,
  handleOpenModal: PropTypes.func.isRequired,
  handleCloseModal: PropTypes.object.isRequired,
  inputHandler: PropTypes.object.isRequired
};

export default modalButton;
