/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Image,
    RefreshControl,
    Platform,
    Dimensions,
    KeyboardAvoidingView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../../styles/theme';
import { BASE_URL } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileTab = ({ user, onUpdate, onUpdateImage, onLogout, onRefresh }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [address, setAddress] = useState(user.address || '');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeInput] = useState(new Animated.Value(0));

    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim() || !phone.trim()) {
            // Add proper validation/alert here
            return;
        }
        setLoading(true);
        try {
            await onUpdate({ name, phone, address });
            setIsEditing(false);
        } catch (e) {
            console.log("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const animateInputFocus = () => {
        Animated.timing(activeInput, {
            toValue: 1,
            duration: 200,
            useNativeDriver: false,
        }).start();
    };

    return (
        <KeyboardAvoidingView
            style={styles.wrapper}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            >
                {/* Modern Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerTopRow}>
                            <Text style={styles.sectionTitle}>My Profile</Text>
                            {!isEditing && (
                                <TouchableOpacity
                                    style={styles.smallEditButton}
                                    onPress={() => {
                                        setName(user.name);
                                        setPhone(user.phone || '');
                                        setAddress(user.address || '');
                                        setIsEditing(true);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Icon name="pen" size={10} color="#fff" />
                                    <Text style={styles.smallEditText}>EDIT</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.sectionSubtitle}>
                            Manage your personal information
                        </Text>
                    </View>
                    <View style={styles.headerDecoration}>
                        <LinearGradient
                            colors={[COLORS.primary + '30', COLORS.secondary + '10']}
                            style={styles.decorationCircle}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </View>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar Section */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[COLORS.primary, COLORS.secondary]}
                                style={styles.profileAvatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {user.profileImage ? (
                                    <Image
                                        source={{ uri: `${BASE_URL}${user.profileImage}` }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                )}
                            </LinearGradient>
                            {!isEditing && (
                                <View style={styles.avatarBadge}>
                                    <Icon name="check-circle" size={12} color="#fff" />
                                </View>
                            )}
                        </View>

                        <View style={styles.profileInfo}>
                            {!isEditing ? (
                                <>
                                    <Text style={styles.profileNameHeader}>{user.name}</Text>
                                    <Text style={styles.profileEmailHeader}>{user.email}</Text>
                                </>
                            ) : (
                                <TouchableOpacity
                                    onPress={onUpdateImage}
                                    style={styles.editAvatarButton}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="camera" size={16} color={COLORS.primary} />
                                    <Text style={styles.editAvatarText}>Change Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Content Area */}
                    {isEditing ? (
                        <View style={styles.editForm}>
                            <Text style={styles.formTitle}>Edit Profile</Text>

                            {/* Form Inputs */}
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Icon name="user" size={12} color={COLORS.primary} />
                                    <Text style={styles.inputLabel}>Full Name</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your full name"
                                    placeholderTextColor={COLORS.secondary + '80'}
                                    onFocus={animateInputFocus}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Icon name="envelope" size={12} color={COLORS.primary} />
                                    <Text style={styles.inputLabel}>Email Address</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.readOnlyInput]}
                                    value={user.email}
                                    editable={false}
                                    placeholder="Email Address"
                                    placeholderTextColor={COLORS.secondary + '80'}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Icon name="phone-alt" size={12} color={COLORS.primary} />
                                    <Text style={styles.inputLabel}>Phone Number</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.readOnlyInput]}
                                    value={phone}
                                    editable={false}
                                    onChangeText={setPhone}
                                    placeholder="+1 (555) 123-4567"
                                    placeholderTextColor={COLORS.secondary + '80'}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Icon name="map-marker-alt" size={12} color={COLORS.primary} />
                                    <Text style={styles.inputLabel}>Address</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Enter your complete address"
                                    placeholderTextColor={COLORS.secondary + '80'}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Action Buttons */}
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => setIsEditing(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.saveButton]}
                                    onPress={handleSave}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Icon name="check" size={14} color="#fff" />
                                            <Text style={styles.saveButtonText}>Save</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.profileDetails}>
                            {/* Personal Information Card */}
                            <View style={styles.infoCard}>
                                <View style={styles.infoCardHeader}>
                                    <Icon name="user-circle" size={16} color={COLORS.primary} />
                                    <Text style={styles.infoCardTitle}>Personal Information</Text>
                                </View>

                                <View style={styles.infoGrid}>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoLabelContainer}>
                                            <Icon name="user" size={12} color={COLORS.secondary} />
                                            <Text style={styles.infoLabel}>Full Name</Text>
                                        </View>
                                        <Text style={styles.infoValue}>{user.name}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoLabelContainer}>
                                            <Icon name="phone" size={12} color={COLORS.secondary} />
                                            <Text style={styles.infoLabel}>Phone</Text>
                                        </View>
                                        <Text style={[
                                            styles.infoValue,
                                            !user.phone && styles.infoValueEmpty
                                        ]}>
                                            {user.phone || 'Not set'}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoLabelContainer}>
                                            <Icon name="map-marker-alt" size={12} color={COLORS.secondary} />
                                            <Text style={styles.infoLabel}>Address</Text>
                                        </View>
                                        <Text style={[
                                            styles.infoValue,
                                            !user.address && styles.infoValueEmpty
                                        ]}>
                                            {user.address || 'Not provided'}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <View style={styles.infoLabelContainer}>
                                            <Icon name="envelope" size={12} color={COLORS.secondary} />
                                            <Text style={styles.infoLabel}>Email</Text>
                                        </View>
                                        <Text style={styles.infoValue}>{user.email}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Logout Button */}
                {!isEditing && (
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={onLogout}
                        activeOpacity={0.7}
                    >
                        <Icon name="sign-out-alt" size={14} color={COLORS.danger} />
                        <Text style={styles.logoutText}>Sign Out</Text>
                    </TouchableOpacity>
                )}

                {/* Footer Note */}
                {!isEditing && (
                    <View style={styles.footerNote}>
                        <Icon name="shield-alt" size={12} color={COLORS.primary} />
                        <Text style={styles.footerNoteText}>
                            Your information is encrypted and secure
                        </Text>
                    </View>
                )}
            </ScrollView>
            <LinearGradient
                colors={['rgba(248, 249, 250, 0)', '#f8f9fa']}
                style={styles.bottomFade}
                pointerEvents="none"
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: Math.min(SCREEN_WIDTH * 0.05, 20),
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    headerContent: {
        zIndex: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.dark,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    headerDecoration: {
        position: 'absolute',
        right: -10,
        top: -10,
    },
    decorationCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        opacity: 0.3,
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: COLORS.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    profileAvatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 26,
        color: '#fff',
        fontWeight: 'bold',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileNameHeader: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 4,
    },
    profileEmailHeader: {
        fontSize: 14,
        color: COLORS.secondary,
    },
    editAvatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    editAvatarText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
    editForm: {
        marginTop: 8,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    inputLabel: {
        fontSize: 13,
        color: COLORS.dark,
        fontWeight: '600',
        marginLeft: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        fontSize: 15,
        color: COLORS.dark,
        borderWidth: 1.5,
        borderColor: '#e9ecef',
    },
    textArea: {
        minHeight: 80,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    readOnlyInput: {
        backgroundColor: '#f1f3f5',
        color: COLORS.secondary,
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1.5,
        borderColor: '#e9ecef',
    },
    cancelButtonText: {
        color: COLORS.secondary,
        fontWeight: '600',
        fontSize: 15,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    profileDetails: {
        marginTop: 8,
    },
    infoCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.dark,
        marginLeft: 10,
    },
    infoGrid: {
        gap: 14,
    },
    infoRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    infoLabel: {
        fontSize: 13,
        color: COLORS.secondary,
        fontWeight: '500',
        marginLeft: 8,
    },
    infoValue: {
        fontSize: 15,
        color: COLORS.dark,
        fontWeight: '500',
    },
    infoValueEmpty: {
        color: '#adb5bd',
        fontStyle: 'italic',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50' + '15',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 6,
    },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    footerNoteText: {
        fontSize: 12,
        color: COLORS.secondary,
        marginLeft: 8,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e9ecef',
        marginTop: 16,
        shadowColor: COLORS.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        color: COLORS.danger,
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 10,
    },
    smallEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    smallEditText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    bottomFade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        zIndex: 20,
    },
});

export default ProfileTab;