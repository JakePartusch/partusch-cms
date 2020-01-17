import React, { useState, useContext, useEffect } from "react";
import { ScrollView, StyleSheet, View, RefreshControl } from "react-native";
import {
  Button,
  Appbar,
  List,
  Snackbar,
  Dialog,
  Portal,
  Paragraph
} from "react-native-paper";
import { fetchEntries, deleteEntry } from "../components/util/contentful.util";
import AuthContext from "../components/context/AuthContext";

export default function ListScreen() {
  const [status, setStatus] = useState("LOADING");
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState();
  const tokens = useContext(AuthContext);

  useEffect(() => {
    const fetchAllPosts = async () => {
      const entries = await fetchEntries(tokens);
      setPosts(entries.items);
      setStatus("POSTS_LOADED");
    };
    fetchAllPosts();
  }, []);

  const onRefresh = async () => {
    setStatus("LOADING");
    const entries = await fetchEntries(tokens);
    setPosts(entries.items);
    setStatus("POSTS_LOADED");
  };

  const removePostFromList = id => {
    const index = posts.findIndex(post => post.sys.id === id);
    posts.splice(index, 1);
    setPosts(posts);
  };

  const handleDelete = async id => {
    try {
      await deleteEntry(tokens, id);
      removePostFromList(id);
      setStatus("DELETED");
    } catch (e) {
      console.log("Something happened", e);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={status === "LOADING"}
            onRefresh={onRefresh}
          />
        }
      >
        <Appbar.Header>
          <Appbar.Content title="Partusch CMS" />
        </Appbar.Header>
        <List.Section>
          {status !== "LOADING" &&
            posts.map(post => (
              <List.Item
                key={post.sys.id}
                title={
                  post.fields.shortDescription
                    ? post.fields.shortDescription["en-US"]
                    : "No Title"
                }
                right={() => (
                  <Button
                    mode="contained"
                    color="#D64545"
                    onPress={() => {
                      setSelectedPost(post);
                      setStatus("DELETE_PENDING");
                    }}
                  >
                    Delete
                  </Button>
                )}
              />
            ))}
        </List.Section>
      </ScrollView>
      <Snackbar
        visible={status === "DELETED"}
        onDismiss={() => setStatus("POSTS_LOADED")}
      >
        Successfully deleted!
      </Snackbar>
      {status === "DELETE_PENDING" && (
        <Portal>
          <Dialog
            visible={status === "DELETE_PENDING"}
            onDismiss={() => setStatus("POSTS_LOADED")}
          >
            <Dialog.Title>Delete this Entry?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>
                {selectedPost.fields.shortDescription["en-US"]}
              </Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                style={{ margin: 10 }}
                onPress={() => setStatus("POSTS_LOADED")}
              >
                Cancel
              </Button>
              <Button
                style={{ margin: 10 }}
                onPress={() => handleDelete(selectedPost.sys.id)}
                mode="contained"
                color="#D64545"
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
