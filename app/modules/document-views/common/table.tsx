import * as React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  IconButton,
  List,
  Text,
} from 'react-native-paper';
import {
  RefreshControl,
} from "react-native";
import { getFileIcon } from './filename';

const dateOptions = { 
  year: 'numeric', 
  month: 'short', 
  day: 'numeric', 
  hour: 'numeric', 
  minute: 'numeric',
  hour12: false
} as const;

export const formatDate = (date: number) => new Date(date).toLocaleString('en-CA', dateOptions);

type DocumentTableProps = {
  edges?: ReadonlyArray<{cursor: string, node: {id: string; createdAt: number; documentUrl: string | null}}>;
  titleExtractor: (item: unknown) => React.ReactNode;
  loading: boolean;
  onEndReached: () => void;
  onRefresh: () => void;
  onPress: (item: unknown) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({edges, loading, onEndReached, onRefresh, titleExtractor, onPress}) => {

  return (
    <FlatList
      data={edges}
      keyExtractor={(edge) => edge.node?.id ?? edge.cursor}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={loading && !!edges}
          onRefresh={onRefresh}
          tintColor="#E5E7EB"
        />
      }
      renderItem={({ item }) => (
        <List.Item
          onPress={() => onPress(item.node)}
          title={titleExtractor(item.node)}
          description={`You uploaded · ${formatDate(item.node.createdAt)}`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={getFileIcon(item.node.documentUrl)}
            />
          )}
          right={() => (
            <IconButton
              icon="dots-vertical"
              onPress={() => {
                // No-op for now
              }}
            />
          )}
          style={styles.listItem}
          titleNumberOfLines={1}
          descriptionNumberOfLines={1}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.muted}>
            No results.
          </Text>
        </View>
      }
    />
  )
}


const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 96,
  },
  listItem: {
    paddingHorizontal: 8,
  },

  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
  muted: {
    color: "#9CA3AF",
    textAlign: "center",
  },
});