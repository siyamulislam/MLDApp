/* eslint-disable */
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Platform,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import PermissionsService, { isIOS } from './Permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Config from "react-native-config";

export const { height, width } = Dimensions.get('window');
const options = {
  mediaType: 'photo',
  quality: 1,
  width: 224,
  height: 224,
  includeBase64: true,
};
const App = () => {

  const isDarkMode = useColorScheme() === 'dark';
  const [result, setResult] = useState('');
  const [label, setLabel] = useState('');
  const [image, setImage] = useState('');
  const [selectedFile, setSelectedFile] = useState();

  const backgroundStyle = {
    // backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    backgroundColor: isDarkMode ? "#0B0D0E95" : "#0B0D0E85",
    // backgroundColor: isDarkMode ? "#014401" : "#016000",
  };
  const openCamera = async () => {
    launchCamera(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const uri = response?.assets[0]?.uri;
        const path = Platform.OS !== 'ios' ? uri : 'file://' + uri;
        console.log(path, uri)
        getResult(path, response);
      }
    });
  };
  const openLibrary = async () => {

    launchImageLibrary(options, async response => {

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {

        const uri = response.assets[0].uri;
        const path = Platform.OS !== 'ios' ? uri : 'file://' + uri;
        getResult(path, response);
      }
    });
  };
  const manageCamera = async (type) => {
    try {
      if (!(await PermissionsService.hasCameraPermission())) {
        return [];
      } else {
        if (type === 'Camera') {
          openCamera();
        } else {
          openLibrary();
        }
      }
    } catch (err) {
      console.log(err);
    }
  };
  const getResult = async (path, response) => {
    setImage(path);
    setLabel('Predicting...');
    setResult('');
    const params = {
      uri: path,
      name: response.assets[0].fileName,
      type: response.assets[0].type,
    };

    let formData = new FormData();
    formData.append('file', params);
    // console.log(formData)
    axios({
      method: 'post',
      url: 'https://mld.onrender.com/predict',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
      .then(function (response) {
        // handle success
        // console.log("success", JSON.stringify(response.data));
        if (response.data) {
          setLabel(response.data['class']);
          setResult(response.data['confidence'] * 100);
        }
      })
      .catch(function (error) {
        setLabel('Failed to predict');
        console.log(error.message)
      });
  };

  const clearOutput = () => {
    setResult('');
    setImage('');
  };

  return (
    <View style={[backgroundStyle, styles.outer]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}  
      />
      <ImageBackground
        blurRadius={8}
        source={require('./assets/img/bg5.jpg')}
        style={{ height: height, width: width }}
      />
      <Text style={styles.title}>{'Mango Leaf Disease \nPrediction App'}</Text>
      <TouchableOpacity onPress={clearOutput} style={styles.clearStyle}>
        <Image source={require('./assets/img/clear.png')} style={styles.clearImage} />
      </TouchableOpacity>
      {(image?.length && (
        <Image source={{ uri: image }} style={styles.imageStyle} />
      )) ||
        null}
      {(result && label && (
        <View style={styles.mainOuter}>
          <Text style={[styles.space, styles.labelText]}>
            {'Label: \n'}
            <Text style={styles.resultText}>{label}</Text>
          </Text>
          <Text style={[styles.space, styles.labelText]}>
            {'Confidence: \n'}
            <Text style={styles.resultText}>
              {parseFloat(result).toFixed(2) + '%'}
            </Text>
          </Text>
        </View>
      )) ||
        (image && <Text style={styles.emptyText}>{label}</Text>) || (
          <Text style={styles.emptyText}>
            Select a mango leaf picture from below button.
          </Text>
        )}
      <View style={styles.btn}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => manageCamera('Camera')}
          style={styles.btnStyle}>
          <Image source={require('./assets/img/camera.png')} style={styles.imageIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => manageCamera('Photo')}
          style={styles.btnStyle}>
          <Image source={require('./assets/img/gallery.png')} style={styles.imageIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
const textShadowTitle=  {
  textShadowColor: 'rgba(0, 0, 0, 0.6)', // Shadow color
  textShadowOffset: { width: 2, height: 2 }, // Shadow offset
  textShadowRadius: 5, // Shadow radius
}
const textShadow=  {
  textShadowColor: 'rgba(0, 0, 0, 0.6)', // Shadow color
  textShadowOffset: { width: 1, height: 1 }, // Shadow offset
  textShadowRadius: 3, // Shadow radius
}
const styles = StyleSheet.create({
  title: {
    ...textShadowTitle,
    alignSelf: 'center',
    textAlign:'center',
    position: 'absolute',
    top: 10,
    fontSize: 30,
    fontWeight: '500',
    color: '#eef1F6',
  },
  clearImage: { height: 40, width: 40, tintColor: '#9fA4A0' },
  mainOuter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: height / 1.6,
    alignSelf: 'center',
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    position: 'absolute',
    bottom: 40,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  btnStyle: {
    backgroundColor: '#FFF',
    opacity: 0.8,
    marginHorizontal: 30,
    padding: 20,
    borderRadius: 20,
  },
  imageStyle: {
    marginBottom: 50,
    width: width / 1.5,
    height: width / 1.5,
    borderRadius: 20,
    position: 'absolute',
    borderWidth: 0.3,
    borderColor: '#FFF',
    top: height / 4.5,
  },
  clearStyle: {
    position: 'absolute',
    top: 100,
    right: 30,
    tintColor: '#FFF',
    zIndex: 10,
  },
  space: { marginVertical: 10, marginHorizontal: 10 },
  labelText: {...textShadow, color: '#FFF', fontSize: 20, // Shadow radius
  },
  resultText: { ...textShadow, fontSize: 32, },
  imageIcon: { height: 40, width: 40, tintColor: '#000' },
  emptyText: {
    ...textShadow,
    position: 'absolute',
    top: height / 1.6,
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 20,
    maxWidth: '70%',
    color: '#FFF',
     // Shadow radius
  },
 

});


export default App;
