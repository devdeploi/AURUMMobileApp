import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, Image, TouchableOpacity, FlatList, TextInput, Animated, Easing } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { PieChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
import { BASE_URL } from '../constants/api';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

// --- Reusable Speedometer Component ---
const Speedometer = ({ progress, label, subLabel }) => {
    const radius = 80;
    const strokeWidth = 12;
    const center = radius + strokeWidth;
    const circumference = Math.PI * radius;

    // Normalize progress 0-100
    const normalizedProgress = Math.min(Math.max(progress / 100, 0), 1);
    const strokeDashoffset = circumference * (1 - normalizedProgress);

    return (
        <View style={styles.speedometerContainer}>
            <Svg width={center * 2} height={center + 10}>
                <Defs>
                    <SvgLinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={COLORS.primary} stopOpacity="1" />
                        <Stop offset="1" stopColor="#B8860B" stopOpacity="1" />
                    </SvgLinearGradient>
                </Defs>
                {/* Background Arc */}
                <Path
                    d={`M${strokeWidth},${center} A${radius},${radius} 0 0,1 ${center * 2 - strokeWidth},${center}`}
                    stroke="#F3F4F6"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress Arc */}
                <Path
                    d={`M${strokeWidth},${center} A${radius},${radius} 0 0,1 ${center * 2 - strokeWidth},${center}`}
                    stroke="url(#brandGrad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </Svg>

            {/* Centered Content below arc */}
            <View style={styles.speedometerTextContainer}>
                <Text style={styles.speedometerScore}>{Math.round(progress)}%</Text>
                <Text style={styles.speedometerLabel}>{label}</Text>
                <Text style={styles.speedometerSub}>{subLabel}</Text>
            </View>
        </View>
    );
};

const LockedOverlay = ({ title }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(animValue, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.delay(8000), // Wait for rest of 10s
                Animated.timing(animValue, { toValue: 0, duration: 0, useNativeDriver: true })
            ])
        );
        loop.start();
    }, []);

    const shimmerTranslate = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 500]
    });

    const sparkleScale = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1.8, 1]
    });

    const sparkleOpacity = animValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.6, 1, 0.6]
    });

    return (
        <View style={styles.lockedOverlay}>
            <LinearGradient
                colors={[COLORS.primary, '#B8860B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            >
                {/* Glitter/Shine Effects */}
                <View style={styles.shineData1} />
                <View style={styles.shineData2} />

                {/* Moving Shimmer */}
                <Animated.View
                    style={[
                        styles.shimmerBar,
                        { transform: [{ translateX: shimmerTranslate }, { skewX: '-30deg' }] }
                    ]}
                />

                {/* Pulsing Sparkle */}
                <Animated.View style={[styles.shineData3, {
                    transform: [{ scale: sparkleScale }],
                    opacity: sparkleOpacity
                }]} />
            </LinearGradient>

            <View style={styles.glassContentContainer}>
                <View style={styles.lockedIconCircle}>
                    <Icon name="crown" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.lockedTextWhite}>Premium Feature</Text>
                <Text style={styles.lockedSubTextWhite}>{title ? `Upgrade to view ${title}` : 'Upgrade to view detailed analytics'}</Text>
            </View>
        </View>
    );
};

const MerchantOverview = ({ user, stats, plans = [], refreshing, onRefresh }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    console.log(user);


    const isPremium = user.plan === 'Premium';

    // --- Helper Functions ---
    const formatCurrencyCompact = (value) => {
        if (value === undefined || value === null) return '0';
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
        return `₹${value}`;
    };

    const formatDate = (dateString, simple = false) => {
        const date = new Date(dateString);
        if (simple) return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit' });
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const getRandomColor = (index) => {
        const colors = ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#6366F1', '#8B5CF6', '#F43F5E', '#14B8A6'];
        return colors[index % colors.length];
    };

    // --- Data Preparation ---

    // 1. Prepare Plan Distribution Donut Data
    const activePlansWithSubs = plans.filter(p => p.subscribers && p.subscribers.length > 0);
    const sortedBySubs = [...activePlansWithSubs].sort((a, b) => b.subscribers.length - a.subscribers.length);

    const chartColors = [COLORS.primary, '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#F472B6'];
    const pieData = sortedBySubs.map((plan, index) => ({
        name: plan.planName,
        population: plan.subscribers.length,
        color: chartColors[index % chartColors.length],
        legendFontColor: "#7F7F7F",
        legendFontSize: 12
    }));

    if (pieData.length === 0) {
        pieData.push({
            name: "No Subscribers",
            population: 0,
            color: "#e0e0e0",
            legendFontColor: "#7F7F7F",
            legendFontSize: 12,
            isPlaceholder: true
        });
    }

    // 2. Users List for Speedometer
    const usersList = useMemo(() => {
        const uniqueUsers = new Map();
        plans.forEach(plan => {
            if (plan.subscribers) {
                plan.subscribers.forEach(sub => {
                    const uId = sub.user?._id || sub.user?.id || sub.user || sub.name;

                    const totalTarget = plan.totalAmount || (plan.monthlyAmount * (plan.duration || 11));
                    const totalPaid = sub.totalPaid || (sub.installmentsPaid * plan.monthlyAmount) || 0;

                    let progress = 0;
                    if (totalTarget > 0) {
                        progress = (totalPaid / totalTarget) * 100;
                    }
                    if (progress > 100) progress = 100;

                    const uniqueKey = `${uId}-${plan._id}`;

                    if (!uniqueUsers.has(uniqueKey)) {
                        uniqueUsers.set(uniqueKey, {
                            id: uniqueKey,
                            userId: uId,
                            name: (sub.user && sub.user.name) ? sub.user.name : (sub.name || 'User'),
                            planName: plan.planName,
                            totalPaid: totalPaid,
                            totalTarget: totalTarget,
                            progress: progress,
                        });
                    }
                });
            }
        });

        let allUsers = Array.from(uniqueUsers.values());
        allUsers.sort((a, b) => a.planName.localeCompare(b.planName));
        return allUsers;
    }, [plans]);

    // Filtered User List
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return usersList;
        return usersList.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.planName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [usersList, searchQuery]);

    useEffect(() => {
        if (!selectedUser && usersList.length > 0) {
            setSelectedUser(usersList[0]);
        }
    }, [usersList]);

    // 3. Recent Transactions
    const recentTransactions = useMemo(() => {
        const all = [];
        plans.forEach(plan => {
            if (plan.subscribers) {
                plan.subscribers.forEach(sub => {
                    all.push({
                        name: (sub.user?.name) || (sub.name || 'Unknown'),
                        image: (sub.user?.profileImage) ? `${BASE_URL}${sub.user.profileImage}` : null,
                        amount: plan.monthlyAmount,
                        date: sub.joinedAt || new Date().toISOString(),
                        planName: plan.planName
                    });
                });
            }
        });
        return all.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    }, [plans]);


    const renderRecentItem = ({ item }) => (
        <View style={styles.recentItem}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: '#F1F5F9' }]}>
                <Text style={styles.avatarInitialsLight}>{getInitials(item.name)}</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.recentPlan} numberOfLines={1}>{item.planName}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.recentAmount}>+{formatCurrencyCompact(item.amount)}</Text>
                <Text style={styles.recentDate}>{formatDate(item.date, true)}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.wrapper}>
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Overview</Text>
                        <Text style={styles.subGreeting}>Welcome, {user.name?.split(' ')[0]}!</Text>
                    </View>
                    <Image source={{ uri: user.profileImage ? `${BASE_URL}${user.profileImage}` : 'https://via.placeholder.com/100' }} style={styles.headerAvatar} />
                </View>

                {/* Monthly Collection Banner - BRAND COLOR */}
                <View style={styles.glassBannerWrapper}>
                    <LinearGradient
                        colors={[COLORS.primary, '#B8860B']} // Brand color gradient
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={styles.glassBanner}
                    >
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                            style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.glassContent}>
                            {/* Left Content */}
                            <View style={styles.bannerLeft}>
                                <Text style={styles.glassLabel}>Monthly Collections</Text>
                                <Text style={styles.glassValue}>
                                    ₹ {stats.totalMonthly?.toLocaleString()}
                                </Text>

                                {/* <View style={styles.trendBadge}>
                                    <Icon name="chart-line" size={10} color="#fff" />
                                    <Text style={styles.trendText}> +12% this month</Text>
                                </View> */}
                            </View>

                            {/* Right Icon */}
                            <View style={styles.bannerRight}>
                                <View style={styles.shinnyIcon}>
                                    <Icon name="rupee-sign" size={22} color="#FFF" />
                                </View>
                            </View>
                        </View>


                        <View style={styles.decoCircle1} />
                        <View style={styles.decoCircle2} />
                    </LinearGradient>

                    {/* Locked Overlay for Standard Users - Full Card */}
                    {!isPremium && (
                        <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 0, overflow: 'hidden' }]}>
                            {/* Blur backing */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                            <LockedOverlay title="Collection Analytics" />
                        </View>
                    )}
                </View>

                {/* Stats Grid - Minimal */}
                <View style={styles.minimalStats}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Subscribers</Text>
                        <Text style={styles.statValue}>{stats.totalEnrolled}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total AUM</Text>
                        <Text style={styles.statValue}>{formatCurrencyCompact(stats.totalAUM)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Active Plans</Text>
                        <Text style={styles.statValue}>{stats.activePlans}</Text>
                    </View>
                </View>

                {/* Donut Chart - Plan Distribution */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Plan Distribution</Text>
                    <View style={styles.donutContainer}>
                        <PieChart
                            data={pieData.map(item => item.isPlaceholder ? { ...item, population: 1 } : item)}
                            width={width}
                            height={220}
                            chartConfig={{
                                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            }}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={width / 4}
                            absolute
                            hasLegend={false}
                        />
                        {/* <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                            <View style={styles.donutHoleContent}>
                                <Text style={styles.donutTotal}>{stats.totalEnrolled}</Text>
                                <Text style={styles.donutLabel}>Users</Text>
                            </View>
                        </View> */}
                    </View>
                    <View style={styles.legendContainer}>
                        {pieData.map((item, idx) => (
                            <View key={idx} style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                <Text style={styles.legendText} numberOfLines={1}>{item.name}</Text>
                                <Text style={styles.legendValue}>({item.population})</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Payment Progress Speedometer */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Subscriber Progress</Text>
                    <Text style={styles.sectionSub}>Track individual payment completion</Text>

                    <View style={styles.speedometerLayout}>
                        {/* Left: Search & User List */}
                        <View style={styles.userListContainer}>
                            <View style={styles.searchBox}>
                                <Icon name="search" size={10} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Search..."
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.searchInput}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>

                            <FlatList
                                data={filteredUsers}
                                keyExtractor={(item, idx) => item.id}
                                showsVerticalScrollIndicator={true}
                                style={{ height: 220 }}
                                nestedScrollEnabled={true}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.userRow,
                                            selectedUser?.id === item.id && styles.userRowActive
                                        ]}
                                        onPress={() => setSelectedUser(item)}
                                    >
                                        <View style={[styles.avatarCircle, { backgroundColor: getRandomColor(index) }]}>
                                            <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                            <Text style={[styles.userNameList, selectedUser?.id === item.id && styles.textActive]} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.userPlanList} numberOfLines={1}>{item.planName}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
                            />
                        </View>

                        {/* Right: Speedometer Display */}
                        <View style={styles.speedometerArea}>
                            {selectedUser ? (
                                <View style={{ alignItems: 'center' }}>
                                    <Speedometer
                                        progress={selectedUser.progress}
                                        label="Paid"
                                        subLabel={`${formatCurrencyCompact(selectedUser.totalPaid)} / ${formatCurrencyCompact(selectedUser.totalTarget)}`}
                                    />
                                    <View style={styles.selectedDetailBox}>
                                        <Text style={styles.selectedNameBig}>{selectedUser.name}</Text>
                                        <Text style={styles.selectedPlanName}>{selectedUser.planName}</Text>
                                    </View>
                                </View>
                            ) : (
                                <Text style={{ color: '#94A3B8', fontSize: 12 }}>Select a user</Text>
                            )}
                        </View>
                    </View>

                    {/* Locked Overlay for Standard Users */}
                    {!isPremium && (
                        <View style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}>
                            {/* Blur effect simulated with semi-transparent background */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.8)' }]} />
                            <LockedOverlay title="Subscriber Insights" />
                        </View>
                    )}
                </View>

                {/* Recent Collections */}
                <View style={[styles.sectionCard, { marginBottom: 20 }]} >
                    <Text style={styles.sectionTitle}>Recent Collections</Text>
                    <View style={{ marginTop: 10 }}>
                        {recentTransactions.map((item, index) => (
                            <View key={index}>
                                {renderRecentItem({ item })}
                                {index < recentTransactions.length - 1 && <View style={styles.listDivider} />}
                            </View>
                        ))}
                    </View>
                    {!isPremium && (
                        <View style={[StyleSheet.absoluteFill, { zIndex: 10, borderRadius: 0, overflow: 'hidden' }]}>
                            {/* Blur backing */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                            <LockedOverlay title="Recent Payments" />
                        </View>
                    )}
                </View >

                {/* Merchant Plan Footer */}
                <View style={styles.planFooter} >
                    <Text style={styles.planFooterLabel}>Merchant Plan</Text>
                    <View style={[
                        styles.planBadge,
                        !isPremium && { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' }
                    ]}>
                        <Icon
                            name={isPremium ? "crown" : "star"}
                            solid
                            size={12}
                            color={isPremium ? "#B8860B" : "#64748B"}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[
                            styles.planName,
                            !isPremium && { color: '#64748B' }
                        ]}>
                            {user.plan || 'Standard Plan'}
                        </Text>
                    </View>
                </View >

            </ScrollView >
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
        backgroundColor: '#F8FAFC',
    },
    container: {
        padding: 20,
        backgroundColor: '#F8FAFC',
        paddingBottom: 100
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 20
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    greeting: {
        fontSize: 14,
        color: COLORS.secondary,
        fontWeight: '600'
    },
    subGreeting: {
        fontSize: 22,
        color: COLORS.dark,
        fontWeight: '800'
    },
    headerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#fff'
    },
    // Banner
    glassBannerWrapper: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, // Increased shadow for brand color pop
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 25,
        borderRadius: 14,
    },
    glassBanner: {
        borderRadius: 14,
        paddingHorizontal: 2,
        paddingVertical: 5,
        minHeight: 130,
        overflow: 'hidden',
        justifyContent: 'center'
    },
    glassContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        zIndex: 5
    },
    bannerLeft: {
        flex: 1,
        justifyContent: 'center'
    },
    bannerRight: {
        width: 64,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 20
    },
    shinnyIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.22)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)'
    },


    glassLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 20
    },
    glassValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginLeft: 20,

        letterSpacing: -0.5
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi transparent
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20
    },
    trendText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '700'
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10
    },
    shinnyIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)'
    },
    decoCircle1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        zIndex: 1
    },
    decoCircle2: {
        position: 'absolute',
        bottom: -50,
        left: -30,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        zIndex: 1
    },


    // Stats
    minimalStats: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2
    },
    statBox: {
        flex: 1,
        alignItems: 'center'
    },
    statLabel: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 4
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.dark
    },
    statDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#F1F5F9',
        alignSelf: 'center'
    },

    // Card
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 4
    },
    sectionSub: {
        fontSize: 12,
        color: '#94A3B8',
        marginBottom: 16
    },

    // Donut
    donutContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 220,
        position: 'relative'
    },
    donutHoleContent: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    donutTotal: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.dark,
        lineHeight: 36
    },
    donutLabel: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
        textTransform: 'uppercase'
    },
    legendContainer: {
        marginTop: 10,
        paddingHorizontal: 10
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%'
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10
    },
    legendText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        marginRight: 6,
        flex: 1
    },
    legendValue: {
        fontSize: 13,
        color: COLORS.dark,
        fontWeight: '700'
    },

    // Speedometer Layout
    speedometerLayout: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    userListContainer: {
        width: '45%',
        borderRightWidth: 1,
        borderRightColor: '#F1F5F9',
        paddingRight: 12
    },
    speedometerArea: {
        width: '55%',
        alignItems: 'center',
        paddingTop: 10,
    },
    // Scaleable Search
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 32,
        marginBottom: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 11,
        color: COLORS.dark,
        marginLeft: 6,
        paddingVertical: 0
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 10,
        marginBottom: 4
    },
    userRowActive: {
        backgroundColor: '#EFF6FF'
    },
    avatarCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitials: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700'
    },
    userNameList: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600'
    },
    userPlanList: {
        fontSize: 10,
        color: '#9CA3AF',
        marginTop: 1
    },
    textActive: {
        color: COLORS.primary,
        fontWeight: '700'
    },
    emptyText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 20
    },

    // Speedometer Visuals
    speedometerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    speedometerTextContainer: {
        marginTop: -30,
        alignItems: 'center'
    },
    speedometerScore: {
        fontSize: 26,
        fontWeight: '800',
        color: COLORS.dark
    },
    speedometerLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 4
    },
    speedometerSub: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '700',
        marginTop: 2
    },
    selectedDetailBox: {
        marginTop: 20,
        alignItems: 'center'
    },
    selectedNameBig: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.dark,
        textAlign: 'center'
    },
    selectedPlanName: {
        fontSize: 12,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 2
    },

    // Recent List
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14
    },
    avatarPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center'
    },
    avatarInitialsLight: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700'
    },
    recentName: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.dark
    },
    recentPlan: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2
    },
    recentAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981'
    },
    recentDate: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 2
    },
    listDivider: {
        height: 1,
        backgroundColor: '#F1F5F9'
    },
    // Footer Plan
    planFooter: {
        alignItems: 'center',
        paddingBottom: 20
    },
    planFooterLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        fontWeight: '600'
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FDE68A'
    },
    planName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309'
    },
    // Locked State
    lockedOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 20,
        overflow: 'hidden',
        borderRadius: 20

    },
    glassContentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10
    },
    shineData1: {
        position: 'absolute',
        top: -50,
        left: -50,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    shineData2: {
        position: 'absolute',
        bottom: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    shineData3: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: 15,
        height: 15,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.9)',
        shadowColor: '#fff',
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 10
    },
    shimmerBar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    lockedIconCircle: {
        marginBottom: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    lockedText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 4
    },
    lockedTextWhite: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 18,
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4
    },
    lockedSubText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 16
    },
    lockedSubTextWhite: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center'
    },
    upgradeButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8
    },
    upgradeButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    }
});

export default MerchantOverview;
