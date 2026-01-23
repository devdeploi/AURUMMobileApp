/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
    TextInput,
    Animated,
    LayoutAnimation
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../../styles/theme';
import { BASE_URL } from '../../constants/api';
import { SkeletonItem } from '../SkeletonLoader';


const MerchantsTab = ({ merchants, refreshing,
    onRefresh, loading, onLoadMore, onSelectMerchant, hasMore }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const searchAnimation = useRef(new Animated.Value(0)).current;

    const toggleSearch = () => {
        if (isSearchVisible) {
            // Hide
            Animated.timing(searchAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start(() => setIsSearchVisible(false));
        } else {
            // Show
            setIsSearchVisible(true);
            Animated.timing(searchAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    // Filter by status AND search query
    const approvedMerchants = merchants.filter(m => {
        const isApproved = m.status === 'Approved';
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.phone && m.phone.includes(query)) ||
            (m.phoneNumber && m.phoneNumber.includes(query)) || // Handle potential different key
            (m.shopName && m.shopName.toLowerCase().includes(query)); // Handle potential shop name key

        return isApproved && matchesSearch;
    });

    if (loading && approvedMerchants.length === 0 && !searchQuery) {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.sectionTitle}>Available Merchants</Text>
                    <Text style={styles.sectionSubtitle}>{approvedMerchants.length} merchants nearby</Text>
                </View>
                <View style={styles.skeletonList}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={styles.skeletonCard}>
                            <SkeletonItem width={64} height={64} borderRadius={12} style={{ marginRight: 16 }} />
                            <View style={{ flex: 1 }}>
                                <SkeletonItem width="70%" height={16} style={{ marginBottom: 8 }} />
                                <SkeletonItem width="50%" height={12} style={{ marginBottom: 6 }} />
                                <SkeletonItem width="30%" height={10} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    const renderMerchantCard = ({ item }) => (
        <TouchableOpacity
            style={styles.merchantCard}
            onPress={() => onSelectMerchant(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.shopImages && item.shopImages.length > 0 ? (
                    <Image
                        source={{ uri: `${BASE_URL}${item.shopImages[0]}` }}
                        style={styles.merchantImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.iconPlaceholder}>
                        <Icon name="store" size={22} color={COLORS.primary} />
                    </View>
                )}
                {item.rating && (
                    <View style={styles.ratingBadge}>
                        <Icon name="star" size={8} color="#fff" solid />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                )}
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.nameRow}>
                    <Text style={styles.merchantName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Icon name="chevron-right" size={12} color={COLORS.secondary} />
                </View>

                <View style={styles.addressRow}>
                    <Icon name="map-marker-alt" size={10} color={COLORS.secondary} style={styles.addressIcon} />
                    <Text style={styles.merchantAddress} numberOfLines={1}>
                        {item.address || 'No address provided'}
                    </Text>
                </View>

                <View style={styles.statusContainer}>
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Approved</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.sectionTitle}>Available Merchants</Text>
                        <Text style={styles.sectionSubtitle}>
                            {approvedMerchants.length} merchant{approvedMerchants.length !== 1 ? 's' : ''} found
                        </Text>
                    </View>
                    <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
                        <Icon name={isSearchVisible ? "times" : "search"} size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Animated Search Bar */}
                {isSearchVisible && (
                    <Animated.View style={[
                        styles.searchWrapper,
                        {
                            opacity: searchAnimation,
                            height: searchAnimation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 50]
                            }),
                            transform: [{
                                translateY: searchAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 0]
                                })
                            }]
                        }
                    ]}>
                        <View style={styles.searchContainer}>
                            <Icon name="search" size={16} color={COLORS.secondary} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name, shop or phone..."
                                placeholderTextColor={COLORS.secondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                    <Icon name="times-circle" size={16} color={COLORS.secondary} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                )}
            </View>

            {approvedMerchants.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Icon name="search" size={40} color={COLORS.light} />
                    </View>
                    <Text style={styles.emptyTitle}>No Merchants Found</Text>
                    <Text style={styles.emptySubtitle}>
                        Try adjusting your search or check back later.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={approvedMerchants}
                    keyExtractor={(item) => item._id}
                    renderItem={renderMerchantCard}
                    contentContainerStyle={styles.listContent}
                    onEndReached={onLoadMore}
                    onEndReachedThreshold={0.3}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.primary]}     // Android
                            tintColor={COLORS.primary}    // iOS
                        />
                    }
                    ListFooterComponent={
                        loading && merchants.length > 0 ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.loadingText}>Loading more merchants...</Text>
                            </View>
                        ) : null
                    }
                />
            )}
            <LinearGradient
                colors={['rgba(250, 251, 252, 0)', '#FAFBFC']}
                style={styles.bottomFade}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    headerContainer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F2F5',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.dark,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: COLORS.secondary,
        letterSpacing: 0.3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F7FA', // Light circular background
        justifyContent: 'center',
        alignItems: 'center'
    },
    // Search Bar Styles
    searchWrapper: {
        overflow: 'hidden',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA', // Light grey background
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 45,
        // marginTop: 5, // Removed, handled by parent spacing or animations
        borderWidth: 1,
        borderColor: '#E1E4E8'
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.dark,
        height: '100%',
        paddingVertical: 0
    },
    clearButton: {
        padding: 5
    },
    listContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    merchantCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: COLORS.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F5F7FA',
    },
    imageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    merchantImage: {
        width: '100%',
        height: '100%',
    },
    iconPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8F4FF',
    },
    ratingBadge: {
        position: 'absolute',
        bottom: -6,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        minWidth: 40,
        justifyContent: 'center',
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 3,
    },
    infoContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    merchantName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.dark,
        flex: 1,
        marginRight: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    addressIcon: {
        marginRight: 6,
    },
    merchantAddress: {
        fontSize: 12,
        color: COLORS.secondary,
        flex: 1,
    },
    statusContainer: {
        flexDirection: 'row',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#065F46',
        letterSpacing: 0.3,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 48,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0F4F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.dark,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    loaderContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        fontSize: 12,
        color: COLORS.secondary,
        marginLeft: 10,
    },
    // Skeleton Styles
    skeletonList: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    skeletonCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F5F7FA',
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

export default MerchantsTab;