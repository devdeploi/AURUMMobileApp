/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import GoldTicker from '../components/GoldTicker';

const MerchantOverview = ({ user, stats }) => {
    return (
        <ScrollView contentContainerStyle={styles.contentContainer}>
            {/* Gold Ticker */}
            <GoldTicker />

            <Text style={[styles.welcomeText, { marginTop: 20 }]}>Welcome, {user.name}</Text>
            <Text style={styles.subText}>Manage your business and chit plans efficiently.</Text>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Icon name="clipboard-list" size={30} color={COLORS.primary} style={{ marginBottom: 10 }} />
                    <Text style={[styles.statNumber, { color: COLORS.primary }]}>{stats.activePlans}</Text>
                    <Text style={styles.statLabel}>Active Plans</Text>
                </View>
                <View style={styles.statCard}>
                    <Icon name="users" size={30} color={COLORS.success} style={{ marginBottom: 10 }} />
                    <Text style={[styles.statNumber, { color: COLORS.success }]}>
                        {stats.totalEnrolled}
                    </Text>
                    <Text style={styles.statLabel}>Total Enrolled</Text>
                </View>
            </View>

            {/* Additional Dashboard Info */}
            <View style={[styles.promoCard, { marginTop: 20, backgroundColor: COLORS.glass, padding: 20, borderRadius: 15 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Icon name="crown" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.primary }}>Your Plan</Text>
                </View>
                <Text style={{ color: COLORS.primaryDark }}>Current Plan: <Text style={{ fontWeight: 'bold' }}>{user.plan || 'Standard'}</Text></Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 20,
        flexGrow: 1
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    }
});

export default MerchantOverview;
