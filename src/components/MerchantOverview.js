import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const MerchantOverview = ({ user, stats }) => {

    const chartConfig = {
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(212, 169, 100, ${opacity})`, // Gold color
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };


    const data = {
        labels: ["Active", "Enrolled"],
        datasets: [
            {
                data: [stats.activePlans || 0, stats.totalEnrolled || 0],
                color: (opacity = 1) => `rgba(212, 169, 100, ${opacity})`, // optional
                strokeWidth: 2 // optional
            }
        ],
        legend: ["Merchant Stats"] // optional
    };

    return (
        <ScrollView contentContainerStyle={styles.contentContainer}>

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

            {/* Charts Section */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Business Overview</Text>
                <LineChart
                    data={data}
                    width={width - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={[styles.statCard, { width: '48%' }]}>
                    <Text style={[styles.statNumber, { fontSize: 18, color: COLORS.dark }]}>₹{stats.totalMonthly?.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Monthly Revenue</Text>
                </View>
                <View style={[styles.statCard, { width: '48%' }]}>
                    <Text style={[styles.statNumber, { fontSize: 18, color: COLORS.dark }]}>₹{stats.totalAUM?.toLocaleString()}</Text>
                    <Text style={styles.statLabel}>Total Value (AUM)</Text>
                </View>
            </View>

            {/* Additional Dashboard Info */}
            <View style={[styles.promoCard, { marginTop: 10, backgroundColor: COLORS.dark, padding: 20, borderRadius: 15, alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'center' }}>
                    <Icon name="crown" size={24} color={COLORS.warning} style={{ marginRight: 10 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.warning }}>Your Plan</Text>
                </View>
                <Text style={{ color: COLORS.warning }}>Current Plan: <Text style={{ fontWeight: 'bold' }}>{user.plan || 'Standard'}</Text></Text>
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
        backgroundColor: COLORS.glass,
        padding: 15,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
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
    },
    chartContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: COLORS.dark,
        textAlign: 'center'
    }
});

export default MerchantOverview;
