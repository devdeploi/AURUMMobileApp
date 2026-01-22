/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS } from '../../styles/theme';
import { LineChart, PieChart } from 'react-native-chart-kit'; // Ensure this is installed
import axios from 'axios';
import { APIURL } from '../../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const DashboardTab = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSaved: 0,
        activeChits: 0,
        monthlyCommitment: 0,
        totalGoal: 0
    });
    const [monthlyData, setMonthlyData] = useState({ labels: [], data: [] });
    const [planDistribution, setPlanDistribution] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // 1. Fetch My Plans (Subscriptions) - assuming endpoint returns array of populated subscription objects
            // Adjust endpoint if necessary based on your backend.
            const { data: plans } = await axios.get(`${APIURL}/chit-plans/my-plans`, config);

            // Calculate Stats
            let totalSaved = 0;
            let monthlyCommitment = 0;
            let totalGoal = 0;
            const activePlans = plans.filter(p => !p.subscription?.status || p.subscription?.status !== 'completed'); // Adjust logic based on real response structure

            // Process Monthly Data (Mock logic for valid dates or aggregate real payment history)
            // For now, let's distribute "totalSaved" over last 6 months generally or use subscription start dates
            // IMPORTANT: If you need precise history per month, you might need a separate /payments/my-history endpoint.
            // Let's deduce stats from plan details provided in `my-plans`.

            plans.forEach(plan => {
                const sub = plan.subscription || {};
                totalSaved += sub.totalAmountPaid || 0;
                totalGoal += plan.totalAmount || 0;
                if (!sub.status || sub.status === 'active') {
                    monthlyCommitment += plan.monthlyAmount || 0;
                }
            });

            setStats({
                totalSaved,
                activeChits: activePlans.length,
                monthlyCommitment,
                totalGoal
            });

            // Prepare Pie Chart Data (Distribution by Plan Name)
            const distribution = activePlans.map((plan, index) => ({
                name: plan.planName,
                population: plan.monthlyAmount,
                color: [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger][index % 5],
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            }));
            setPlanDistribution(distribution);


            // Mock Monthly Growth (or fetch real history)
            // Real implementation would calculate sum of payments grouped by Month
            setMonthlyData({
                labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
                data: [
                    Math.max(0, totalSaved - (monthlyCommitment * 5)),
                    Math.max(0, totalSaved - (monthlyCommitment * 4)),
                    Math.max(0, totalSaved - (monthlyCommitment * 3)),
                    Math.max(0, totalSaved - (monthlyCommitment * 2)),
                    Math.max(0, totalSaved - monthlyCommitment),
                    totalSaved
                ]
            });


            setRecentActivity(plans.slice(0, 3)); // Just showing top 3 plans as "recent" for now

        } catch (error) {
            console.error("Dashboard Fetch Error", error);
        } finally {
            setLoading(false);
        }
    };


    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(212, 169, 100, ${opacity})`,
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.headerSection}>
                <Text style={styles.welcomeText}>Hello, {user.name.split(' ')[0]}</Text>
                <Text style={styles.subText}>Here is your financial overview</Text>
            </View>


            {/* Key Stats Cards */}
            <View style={styles.statGrid}>
                <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Icon name="piggy-bank" size={20} color="#fff" style={{ opacity: 0.8 }} />
                        <Text style={[styles.statLabel, { color: '#fff' }]}>Total Saved</Text>
                    </View>
                    <Text style={[styles.statValue, { color: '#fff' }]}>₹ {stats.totalSaved.toLocaleString()}</Text>
                    <Text style={{ color: '#fff', fontSize: 10, opacity: 0.8 }}>Output: ~₹{stats.totalGoal.toLocaleString()}</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Icon name="calendar-check" size={20} color={COLORS.primary} />
                        <Text style={styles.statLabel}>Monthly Due</Text>
                    </View>
                    <Text style={[styles.statValue, { color: COLORS.dark }]}>₹ {stats.monthlyCommitment.toLocaleString()}</Text>
                    <Text style={{ color: COLORS.secondary, fontSize: 10 }}>Across {stats.activeChits} Plans</Text>
                </View>
            </View>

            {/* Savings Growth Chart */}
            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Savings Growth (6 Months)</Text>
                <LineChart
                    data={{
                        labels: monthlyData.labels,
                        datasets: [{ data: monthlyData.data }]
                    }}
                    width={width - 50} // from react-native
                    height={220}
                    yAxisLabel="₹"
                    yAxisInterval={1} // optional, defaults to 1
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        marginVertical: 8,
                        borderRadius: 16
                    }}
                />
            </View>

            {/* Plan Distribution (Pie) */}
            {planDistribution.length > 0 && (
                <View style={styles.chartContainer}>
                    <Text style={styles.chartTitle}>Investment Distribution</Text>
                    <PieChart
                        data={planDistribution}
                        width={width - 40}
                        height={200}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                </View>
            )}

            {/* Recent Activity List */}
            <Text style={styles.sectionTitle}>Your Active Chits</Text>
            {recentActivity.map((plan, index) => (
                <View key={index} style={styles.activityCard}>
                    <View style={styles.activityIcon}>
                        <Icon name="gem" size={16} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>{plan.planName}</Text>
                        <Text style={styles.activityDate}>Started: {new Date(plan.subscription?.startDate || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.activityAmount}>Paid: ₹{plan.subscription?.totalAmountPaid}</Text>
                        <Text style={styles.activityStatus}>{plan.subscription?.status || 'Active'}</Text>
                    </View>
                </View>
            ))}
            {recentActivity.length === 0 && (
                <View style={styles.activityCard}>
                    <Text style={{ color: COLORS.secondary }}>No active plans yet.</Text>
                </View>
            )}

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerSection: {
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.dark,
    },
    subText: {
        fontSize: 14,
        color: COLORS.secondary,
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 15,
        color: COLORS.dark,
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 10,
        marginLeft: 10
    },
    statGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 25,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        justifyContent: 'space-between',
        minHeight: 120
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginVertical: 10
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        textTransform: 'uppercase',
        fontWeight: '600'
    },
    activityCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        elevation: 2,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    activityIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary + '20', // 20% opacity hex
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.dark
    },
    activityDate: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: 2
    },
    activityAmount: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.success
    },
    activityStatus: {
        fontSize: 10,
        color: COLORS.secondary,
        textTransform: 'uppercase',
        marginTop: 2
    }
});

export default DashboardTab;
