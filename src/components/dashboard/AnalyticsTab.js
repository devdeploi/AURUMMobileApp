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

const AnalyticsTab = () => {
    return (
        <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Chit Analytics</Text>
            <SavingsChart />
            <View style={[styles.statCard, { marginTop: 20, width: '100%' }]}>
                <Text style={styles.statLabel}>Projected Savings</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>₹ 2,40,000</Text>
                <Text style={{ color: COLORS.secondary, fontSize: 12, marginTop: 5 }}>By Dec 2026</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 80,
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
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
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
});

export default AnalyticsTab;
