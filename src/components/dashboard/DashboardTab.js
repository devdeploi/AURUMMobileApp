/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../styles/theme';

const SavingsChart = () => {
    const savingsData = [20, 45, 28, 80, 99, 43];
    return (
        <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Monthly Savings Growth</Text>
            <View style={styles.chartBody}>
                {savingsData.map((value, index) => (
                    <View key={index} style={styles.barContainer}>
                        <View style={[styles.bar, { height: `${value}%` }]} />
                        <Text style={styles.barLabel}>{['J', 'F', 'M', 'A', 'M', 'J'][index]}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const DashboardTab = ({ user }) => {
    return (
        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.welcomeText}>Welcome back, {user.name}!</Text>

            <SavingsChart />

            <View style={styles.statGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>₹ 1.2L</Text>
                    <Text style={styles.statLabel}>Total Saved</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>3</Text>
                    <Text style={styles.statLabel}>Active Chits</Text>
                </View>
            </View>

            <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <View style={styles.activityCard}>
                    <Text style={{ color: COLORS.secondary }}>No recent activity.</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 80,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: COLORS.dark,
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 15,
    },
    chartBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        marginBottom: 5,
    },
    barLabel: {
        fontSize: 10,
        color: COLORS.secondary,
    },
    statGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        width: '48%',
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: 5,
    },
    activityCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondary,
        elevation: 1,
    },
});

export default DashboardTab;
