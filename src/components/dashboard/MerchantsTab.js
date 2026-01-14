/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Image,
    Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../../styles/theme';
import { BASE_URL } from '../../constants/api';

const SkeletonItem = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, [opacity]);

    return (
        <View style={styles.skeletonCard}>
            <Animated.View style={[styles.skeletonImage, { opacity }]} />
            <View style={styles.skeletonContent}>
                <Animated.View style={[styles.skeletonLine, { width: '70%', height: 16, marginBottom: 8, opacity }]} />
                <Animated.View style={[styles.skeletonLine, { width: '50%', height: 12, marginBottom: 6, opacity }]} />
                <Animated.View style={[styles.skeletonLine, { width: '30%', height: 10, opacity }]} />
            </View>
        </View>
    );
};

const MerchantsTab = ({ merchants, loading, onLoadMore, onSelectMerchant, hasMore }) => {
    // Filter only approved merchants
    const approvedMerchants = merchants.filter(m => m.status === 'Approved');

    if (loading && approvedMerchants.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.sectionTitle}>Available Merchants</Text>
                    <Text style={styles.sectionSubtitle}>{approvedMerchants.length} merchants nearby</Text>
                </View>
                <View style={styles.skeletonList}>
                    {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
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
                <Text style={styles.sectionTitle}>Available Merchants</Text>
                <Text style={styles.sectionSubtitle}>
                    {approvedMerchants.length} merchant{approvedMerchants.length !== 1 ? 's' : ''} nearby
                </Text>
            </View>

            {approvedMerchants.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Icon name="store-slash" size={40} color={COLORS.light} />
                    </View>
                    <Text style={styles.emptyTitle}>No Merchants Available</Text>
                    <Text style={styles.emptySubtitle}>
                        There are currently no approved merchants in your area
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
    skeletonImage: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F0F4F8',
        marginRight: 16,
    },
    skeletonContent: {
        flex: 1,
    },
    skeletonLine: {
        backgroundColor: '#F0F4F8',
        borderRadius: 4,
    },
});

export default MerchantsTab;