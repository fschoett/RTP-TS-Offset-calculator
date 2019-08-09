class Frame {
  constructor(){
    this.index= 0;

    // vvv All of type Statistics vvv
    this.rtp_offset = {};
    this.rec_offset = {};
    this.ts_delta   = {};

    this.rtpTs = {};
    this.recTs = {};
  }

  set_rtp_offset( new_offset ){
    if( this.checkInput( new_offset ) ){
      this.rtp_offset = new_offset;
    }
  }

  set_rec_offset( new_offset ){
    if( this.checkInput( new_offset ) ){
      this.rec_offset = new_offset;
    }
  }

  set_ts_delta( new_delta ){
    if( this.checkInput( new_delta ) ){
      this.ts_delta = new_delta;
    }
  }

  set_rtpTs( newRtpTs ){
    if( this.checkInput( newRtpTs )){
      this.rtpTs = newRtpTs;
    }
  }

  set_recTs( newRecTs ){
    if( this.checkInput( newRecTs )){
      this.recTs = newRecTs;
    }
  }



  checkInput( input ){
    if( input.min && input.max  && input.avg && input.std_dev && input.vals ){
      return true
    }
    else{
      return true
    }
  }


}
