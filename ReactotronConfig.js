import Reactotron from 'reactotron-react-native';

const reactotron = Reactotron.configure({
  host: '127.0.0.1',
})
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
  })
  .connect();
console.log('Reactotron is connected!');
export default reactotron;