/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../styles/theme';
import { LineChart, PieChart } from 'react-native-chart-kit'; // Ensure this is installed
import axios from 'axios';
import { APIURL } from '../../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');

const DashboardTab = ({ user }) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
        // Only set main loading if not refreshing
        if (!refreshing) setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };

            // 1. Fetch My Plans (Subscriptions) - assuming endpoint returns array of populated subscription objects
            // Adjust endpoint if necessary based on your backend.
            const { data: plans } = await axios.get(`${APIURL}/chit-plans/my-plans`, config);

            // Calculate Stats
            let totalSaved = 0;
            let monthlyCommitment = 0;
            let totalGoal = 0;

            // Filter active plans
            const activePlans = plans.filter(p => !p.status || p.status === 'active' || p.status === 'pending');

            plans.forEach(plan => {
                totalSaved += plan.totalSaved || 0;
                totalGoal += plan.totalAmount || 0;

                if (!plan.status || plan.status === 'active') {
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
            // Use totalSaved instead of monthlyAmount, truncate name
            const distribution = activePlans.map((plan, index) => ({
                name: plan.planName, // Full name, handled in scrollable legend
                population: plan.totalSaved || 0,
                color: [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger][index % 5],
                legendFontColor: "#7F7F7F",
                legendFontSize: 11
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


            setRecentActivity(plans.slice(0, 5));
        } catch (error) {
            console.error("Dashboard Fetch Error", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
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

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
            >
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
                        width={width - 60}
                        height={220}
                        // yAxisLabel="₹"
                        formatYLabel={(value) => {
                            const val = parseFloat(value);
                            return val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
                        }}
                        yAxisInterval={1} // optional, defaults to 1
                        chartConfig={chartConfig}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                        withInnerLines={false}
                    />
                </View>

                {/* Plan Distribution (Pie) */}
                {planDistribution.length > 0 && (
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>Investment Distribution</Text>
                        <View style={{ alignItems: 'center', marginBottom: 10 }}>
                            <PieChart
                                data={planDistribution}
                                width={width - 60}
                                height={200}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"0"}
                                center={[(width - 60) / 4, 0]}
                                absolute
                                hasLegend={false}
                            />
                        </View>

                        <ScrollView
                            style={styles.legendContainer}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                        >
                            {planDistribution.map((item, index) => (
                                <View key={index} style={styles.legendItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                        <Text style={styles.legendText} numberOfLines={1} ellipsizeMode="tail">
                                            {item.name}
                                        </Text>
                                    </View>
                                    <Text style={styles.legendValue}>₹{item.population.toLocaleString()}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Recent Activity List - Horizontal Scroll */}
                <Text style={styles.sectionTitle}>Your Active Chits</Text>
                {recentActivity.length > 0 ? (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {recentActivity.map((plan, index) => (
                            <View key={index} style={styles.activityCardCompact}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.activityIconSmall}>
                                        <Icon name="gem" size={14} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.activityStatusSmall}>{plan.status || 'Active'}</Text>
                                </View>

                                <Text style={styles.activityTitleCompact}>{plan.planName}</Text>

                                <View style={styles.cardFooter}>
                                    <View>
                                        <Text style={styles.labelSmall}>Saved</Text>
                                        <Text style={styles.amountSmall}>₹{plan.totalSaved?.toLocaleString()}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.labelSmall}>Joined</Text>
                                        <Text style={styles.dateSmall}>{new Date(plan.joinedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.activityCard}>
                        <Text style={{ color: COLORS.secondary }}>No active plans yet.</Text>
                    </View>
                )}

            </ScrollView>
            <LinearGradient
                colors={['rgba(248, 250, 252, 0)', '#F8FAFC']}
                style={styles.bottomFade}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#F8FAFC'
    },
    content: {
        padding: 20,
        paddingBottom: 100, // Increased padding
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
    // Legend Styles
    legendContainer: {
        maxHeight: 120, // Limit height
        marginTop: 10,
        paddingHorizontal: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        justifyContent: 'space-between',
        width: '100%'
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10
    },
    legendText: {
        fontSize: 12,
        color: COLORS.secondary,
        flex: 1,
        marginRight: 10
    },
    legendValue: {
        fontSize: 12,
        color: COLORS.dark,
        fontWeight: '600'
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
    // Compact Horizontal Card Styles
    activityCardCompact: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        elevation: 3,
        marginBottom: 10,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        width: 160, // Fixed width for compact look
        minHeight: 130,
        justifyContent: 'space-between'
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    activityIconSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityStatusSmall: {
        fontSize: 10,
        color: COLORS.success,
        fontWeight: '700',
        textTransform: 'uppercase',
        backgroundColor: COLORS.success + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    activityTitleCompact: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.dark,
        marginBottom: 12,
        lineHeight: 20
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    labelSmall: {
        fontSize: 10,
        color: COLORS.secondary,
        marginBottom: 2
    },
    amountSmall: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    dateSmall: {
        fontSize: 11,
        color: COLORS.dark,
        fontWeight: '500'
    },
    // Fallback
    activityCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center'
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 20
    }
});

export default DashboardTab;
