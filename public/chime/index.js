console.log(window.ChimeSDK);

let logger, meetingSession;
let audioInputDevices = [],
  videoInputDevices = [],
  audioOutputDevices = [];

initMeetingSession = async () => {
  logger = new ChimeSDK.ConsoleLogger('MyLogger', ChimeSDK.LogLevel.ERROR);
  const deviceController = new ChimeSDK.DefaultDeviceController(logger);

  const meetingResponse = JSON.parse(document.getElementById('meetingJson').value);
  const attendeeResponse = JSON.parse(document.getElementById('attendeeJson').value);
  console.log(meetingResponse, attendeeResponse);
  const configuration = new ChimeSDK.MeetingSessionConfiguration(meetingResponse, attendeeResponse);
  meetingSession = new ChimeSDK.DefaultMeetingSession(configuration, logger, deviceController);

  listDevices();
};

listDevices = async () => {
  audioInputDevices = await meetingSession.audioVideo.listAudioInputDevices();
  videoInputDevices = await meetingSession.audioVideo.listVideoInputDevices();

  console.log(audioInputDevices, videoInputDevices);

  fillDeviceDropdown(audioInputDevices, 'microphone');
  fillDeviceDropdown(videoInputDevices, 'camera');

  audioOutputDevices = await meetingSession.audioVideo.listAudioOutputDevices();
  fillDeviceDropdown(audioOutputDevices, 'speaker');

  document.querySelector('#json-form').classList.add('hidden');
  document.querySelector('#devices-setup').classList.remove('hidden');
};

fillDeviceDropdown = (devices, targetId) => {
  let options = '';
  for (let i = 0; i < devices.length; i++) {
    const device = devices[i];
    options += '<option value="' + device.deviceId + '">' + device.label + '</option>';
  }
  document.getElementById(targetId).innerHTML = options;
};

joinMeeting = async () => {
  await chooseDevice();
  await bindAudioVideoToHtml();
};

chooseDevice = async () => {
  let microphone_idx = document.getElementById('microphone').selectedIndex;
  let camera_idx = document.getElementById('camera').selectedIndex;
  let speaker_idx = document.getElementById('speaker').selectedIndex;

  let microphone = audioInputDevices[microphone_idx];
  let camera = videoInputDevices[camera_idx];
  let speaker = audioOutputDevices[speaker_idx];

  console.log(microphone, camera, speaker);

  await meetingSession.audioVideo.chooseAudioInputDevice(microphone.deviceId);
  await meetingSession.audioVideo.chooseVideoInputDevice(camera.deviceId);
  await meetingSession.audioVideo.chooseAudioOutputDevice(speaker.deviceId);
};

bindAudioVideoToHtml = async () => {
  const audioOutputElement = document.getElementById('audio');
  try {
    await meetingSession.audioVideo.bindAudioElement(audioOutputElement);
  } catch (e) {
    console.error('Failed to bindAudioElement ', e);
  }

  meetingSession.audioVideo.addObserver(observer);
  meetingSession.audioVideo.startLocalVideoTile();
  meetingSession.audioVideo.start();

  document.querySelector('#video-container').classList.remove('hidden');
};

const videoElementSelf = document.getElementById('video-tile-self');
const videoElementOther = document.getElementById('video-tile-other');

const observer = {
  audioVideoDidStart: () => {
    logger.debug('Started');
  },

  videoTileDidUpdate: (tileState) => {
    if (!tileState.boundAttendeeId) {
      return;
    }
    if (tileState.localTile) {
      meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElementSelf);
    } else {
      console.log('======================================= other =====================================');
      console.log(tileState.tileId);
      if (!document.getElementById(tileState.tileId)) {
        const node = document.createElement('video');
        node.id = tileState.tileId;
        node.style.width = '100%';
        node.style.height = '100%';
        videoElementOther.appendChild(node);
      }
      const videoElementNew = document.getElementById(tileState.tileId);
      meetingSession.audioVideo.bindVideoElement(tileState.tileId, videoElementNew);
    }
  },
  videoTileWasRemoved: (tileId) => {
    const videoElementRemoved = document.getElementById(tileId);
    videoElementRemoved.remove();
  },
};
