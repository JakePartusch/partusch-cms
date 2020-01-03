import React, { useState, useContext } from "react";
import { ScrollView, StyleSheet, View, Image } from "react-native";
import {
  TextInput,
  Checkbox,
  Text,
  Button,
  Appbar,
  Snackbar,
  IconButton
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import {
  uploadImage,
  processImage,
  publishImage,
  linkUploadToAsset,
  uriToBlob,
  createEntry,
  publishEntry
} from "../components/util/contentful.util";
import AuthContext from "../components/context/AuthContext";

export default function HomeScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState([]);
  const [isMilo, setIsMilo] = useState(false);
  const [isOliver, setIsOliver] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishDate, setPublishDate] = useState(dayjs().format("MM/DD/YYYY"));
  const [openDatePicker, setOpenDatepicker] = useState(false);
  const tokens = useContext(AuthContext);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1
      });

      if (!result.cancelled) {
        const imageBlob = await uriToBlob(result.uri);
        const imageData = await uploadImage(tokens, imageBlob);
        const filePathParts = result.uri.split("/");
        const fileName = filePathParts[filePathParts.length - 1];
        const asset = await linkUploadToAsset(
          tokens,
          imageData.sys.id,
          fileName,
          imageBlob.type
        );
        await processImage(tokens, asset.sys.id);
        await publishImage(tokens, asset.sys.id, images, setImages);
      }
    } catch (e) {
      console.error("Unable to upload image", e);
    }
  };

  const onSubmit = async () => {
    try {
      const entryResponse = await createEntry(tokens, {
        title,
        body,
        isMilo,
        isOliver,
        images,
        publishDate
      });
      await publishEntry(tokens, entryResponse.sys.id);

      setShowSuccess(true);
    } catch (e) {
      console.log("Unable to save", e);
    }
  };

  const handlePublishedDateChange = newDate => {
    if (newDate && typeof newDate === "object") {
      setPublishDate(dayjs(newDate).format("MM/DD/YYYY"));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Appbar.Header>
          <Appbar.Content title="Partusch CMS" />
        </Appbar.Header>
        <View style={{ margin: 20 }}>
          <Button icon="camera" mode="outlined" onPress={pickImage}>
            Upload an image
          </Button>
        </View>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {images.map(image => (
            <Image
              key={image.sys.id}
              source={{
                uri: `https:${image.fields.file["en-US"].url}?w=150&h=150`
              }}
              style={{ width: 150, height: 150, marginLeft: 10 }}
            />
          ))}
        </View>
        <View style={{ padding: 20 }}>
          <TextInput
            mode="flat"
            label="Title"
            onChangeText={value => setTitle(value)}
            value={title}
            style={styles.input}
          />
          <TextInput
            label="Body"
            onChangeText={value => setBody(value)}
            value={body}
            style={styles.input}
            multiline
          />
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20
            }}
          >
            <TextInput
              label="Publish Date"
              onChangeText={value => setPublishDate(value)}
              value={publishDate}
              style={{ flexGrow: 1, marginRight: 5 }}
              multiline
            />
            <IconButton
              mode="outlined"
              icon="calendar"
              style={{ height: "100%" }}
              onPress={() => setOpenDatepicker(true)}
            ></IconButton>
          </View>
          {openDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode={"date"}
              display="default"
              onChange={(e, date) => {
                setOpenDatepicker(false);
                handlePublishedDateChange(date);
              }}
            />
          )}
          <View style={styles.radio}>
            <Text>Milo</Text>
            <Checkbox
              status={isMilo ? "checked" : "unchecked"}
              onPress={() => setIsMilo(!isMilo)}
            />
          </View>
          <View style={styles.radio}>
            <Text>Oliver</Text>
            <Checkbox
              status={isOliver ? "checked" : "unchecked"}
              onPress={() => setIsOliver(!isOliver)}
            />
          </View>
        </View>
      </ScrollView>
      <View style={{ margin: 20 }}>
        <Button style={{ padding: 5 }} mode="contained" onPress={onSubmit}>
          Submit
        </Button>
      </View>
      <Snackbar
        visible={showSuccess}
        onDismiss={() => {
          setShowSuccess(false);
        }}
        action={{
          label: "Start New Post",
          onPress: () => {
            setTitle("");
            setBody("");
            setImages([]);
            setIsMilo(false);
            setIsOliver(false);
            setShowSuccess(false);
            setPublishDate(dayjs().format("MM/DD/YYYY"));
          }
        }}
      >
        Successfully published!
      </Snackbar>
    </View>
  );
}

HomeScreen.navigationOptions = {
  header: null
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 30
  },
  radio: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "25%",
    marginBottom: 10
  },
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
