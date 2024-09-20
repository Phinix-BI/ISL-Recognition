import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
} from 'react-native';
import axios from 'axios';
import io from 'socket.io-client';
import {baseUrl} from '../../utils';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video from 'react-native-video';

const socket = io(baseUrl);

const ChatScreen = ({navigation, route}) => {
  const [message, setMessage] = useState({
    message: '',
    mediaUrl: {url: '', type: ''},
  });
  const [chat, setChat] = useState([]);
  const [senderId, setSenderId] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [fileResponse, setFileResponse] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null); // State to hold profile picture URL
  const {sender, recipient , recipientName} = route.params;

  useEffect(() => {
  
    const fetchUserIds = async () => {
      try {
        const senderResponse = await axios.get(
          `${baseUrl}/api/v1/auth/getUserId/${sender}`,
        );
        const recipientResponse = await axios.get(
          `${baseUrl}/api/v1/auth/getUserId/${recipient}`,
        );

        setSenderId(senderResponse.data.data.id);
        setRecipientId(recipientResponse.data.data.id);

        // Fetch profile picture
        const recipientProfileResponse = await axios.get(
          `${baseUrl}/api/v1/user/getProfilePicture/${recipientResponse.data.data.id}`,
          {
            headers: {
              'x-auth-token': await AsyncStorage.getItem('token'),
            },
          },
        );

        setProfilePicture(recipientProfileResponse.data.data);

        try {
          const messagesResponse = await axios.get(
            `${baseUrl}/api/v1/chat/messages/${senderResponse.data.data.id}/${recipientResponse.data.data.id}`,
          );
          const data = messagesResponse.data.data;
          setChat(data.messages.length !== 0 ? data.messages : []);
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setChat([]);
        }
        console.error('Error fetching user IDs:', error);
      }
    };

    fetchUserIds();

    if (senderId && recipientId) {
      socket.emit('joinRoom', {sender: senderId, recipient: recipientId});

      socket.on('receiveMessage', message => {
        setChat(prevChat => [...prevChat, message]);
      });

      return () => {
        socket.off('receiveMessage');
      };
    }
  }, [senderId, recipientId]);

  // Set the profile picture in the header
  useEffect(() => {
    if (profilePicture) {
      navigation.setOptions({
        headerLeft: () => (
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Image
              source={{uri: profilePicture}}
              style={{width: 40, height: 40, borderRadius: 20, marginLeft: 10}}
            />
          </View>
        ),
        headerRight: () => (
          <TouchableOpacity className="mr-5">
            <MaterialIcons name="videocam" size={30} color="white" />
          </TouchableOpacity>
        ),
        headerTitle: recipientName, // Display recipient name next to profile pic
      });
    }
  }, [profilePicture]);

  const sendMessage = async () => {
    if (message.message.trim() === '' && message.mediaUrl.url.trim() === '')
      return;
    if (!senderId || !recipientId) return;

    const messageObject = {
      sender: senderId,
      recipient: recipientId,
      content: message,
      timestamp: new Date(),
    };

    socket.emit('sendMessage', messageObject);

    setMessage({message: '', mediaUrl: {url: '', type: ''}});
    setFileResponse(null);
  };

  const selectFile = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      setFileResponse(res[0]);
      setMessage({message: '', mediaUrl: {url: '', type: ''}});
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User canceled the file picker');
      } else {
        console.log('Error picking file:', err);
      }
    }
  };

  const uploadFile = async () => {
    if (!fileResponse) return;

    const formData = new FormData();
    formData.append('mediaUpload', {
      uri: fileResponse.uri,
      type: fileResponse.type,
      name: fileResponse.name,
    });

    try {
      const response = await axios.post(
        `${baseUrl}/api/v1/sender/upload-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-auth-token': await AsyncStorage.getItem('token'),
          },
        },
      );

      const messageObject = {
        sender: senderId,
        recipient: recipientId,
        content: {
          message: '',
          mediaUrl: {
            url: response.data.data.finalResult.url,
            type: response.data.data.finalResult.resource_type,
          },
        },
        timestamp: new Date(),
      };

      socket.emit('sendMessage', messageObject);
      setMessage({message: '', mediaUrl: {url: '', type: ''}});
      setFileResponse(null);
    } catch (error) {
      console.log('Error uploading file:', error);
    }
  };

  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const uniqueKey = (item, index) => index.toString();

  return (
    <View className="flex-1" style={{backgroundColor: '#12191f'}}>
      <ImageBackground
        source={require('../../assets/w-b-g.jpg')}
        resizeMode="cover"
        className="px-3 py-3 flex-1 justify-center">
        <FlatList
          data={chat}
          keyExtractor={uniqueKey}
          renderItem={({item}) => (
            <View
              className={`mb-2 p-2 ${
                item.sender === senderId ? 'self-end' : 'self-start'
              } rounded-lg`}
              style={{
                backgroundColor:
                  item.sender === senderId ? '#134d37' : '#1f2c34',
              }}>
              {item.content.mediaUrl.url !== '' ? (
                item.content.mediaUrl.type === 'image' ? (
                  <Image
                    source={{uri: item.content.mediaUrl.url}}
                    style={{width: 100, height: 100}}
                  />
                ) : (
                  <Video
                    source={{uri: item.content.mediaUrl.url}}
                    style={{width: 100, height: 100}}
                  />
                )
              ) : (
                <Text className="text-lg mt-1" style={{color: '#f0f0f0'}}>
                  {item.content.message}
                </Text>
              )}
              <Text className="text-xs text-gray-500 text-right">
                {formatTime(item.timestamp)}
              </Text>
            </View>
          )}
        />
        <View className="flex-row items-center mt-4">
          <View className="flex-row flex-1 relative">
            {fileResponse ? (
              <Text
                className="flex-1 py-2 px-4 text-slate-300 rounded-3xl"
                style={{backgroundColor: '#1f2c34'}}>
                {fileResponse.name}
              </Text>
            ) : (
              <TextInput
                value={message.message}
                onChangeText={text => setMessage({...message, message: text})}
                placeholder="Type a message..."
                placeholderTextColor={'#a3a3a3'}
                cursorColor={'white'}
                className="flex-1 py-2 px-4 text-slate-300 rounded-3xl"
                style={{
                  backgroundColor: '#1f2c34',
                  textAlignVertical: 'center',
                  minHeight: 40,
                }}
                multiline={true}
              />
            )}

            {message.message === '' && (
              <>
                <TouchableOpacity
                  onPress={selectFile}
                  style={{
                    position: 'absolute',
                    right: 48,
                    top: '50%',
                    transform: [{translateY: -12}],
                  }}>
                  <MaterialIcons name="attach-file" size={23} color={'white'} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={selectFile}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: [{translateY: -12}],
                  }}>
                  <MaterialIcons
                    name="photo-camera"
                    size={23}
                    color={'white'}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={fileResponse ? uploadFile : sendMessage}
            className="ml-2 p-2 rounded-full"
            style={{backgroundColor: '#21c063'}}>
            <MaterialIcons
              name={
                fileResponse ? 'send' : message.message === '' ? 'mic' : 'send'
              }
              size={23}
              color={'white'}
            />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};

export default ChatScreen;
