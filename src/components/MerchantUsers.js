import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

const MerchantUsers = ({ subscribers }) => {
    return (
        <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Subscribers</Text>
            {subscribers.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Icon name="users-slash" size={50} color={COLORS.secondary} style={styles.emptyStateIcon} />
                    <Text style={styles.emptyStateText}>No subscribers yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={subscribers}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.subscriberCard}>
                            <View style={styles.subscriberRow}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : 'U'}</Text>
                                </View>
                                <View style={styles.subscriberInfo}>
                                    <Text style={styles.subscriberName}>{item.name || 'Unknown User'}</Text>
                                    <Text style={styles.subscriberPlan}>{item.planName}</Text>
                                </View>
                            </View>
                            <View>
                                <Text style={styles.subscriberAmount}>₹{item.planAmount}</Text>
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.subscribersList}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
        flex: 1
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyStateIcon: {
        opacity: 0.5,
        marginBottom: 10
    },
    emptyStateText: {
        textAlign: 'center',
        color: '#999'
    },
    subscriberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    subscriberRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold'
    },
    subscriberInfo: {
        marginLeft: 15
    },
    subscriberName: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 15
    },
    subscriberPlan: {
        fontSize: 12,
        color: '#666'
    },
    subscriberAmount: {
        fontWeight: 'bold',
        color: COLORS.primary,
        fontSize: 15
    },
    subscribersList: {
        paddingBottom: 20
    }
});

export default MerchantUsers;
