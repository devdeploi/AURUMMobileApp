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
    Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { COLORS } from '../../styles/theme';
import { BASE_URL } from '../../constants/api';

const ProfileTab = ({ user, onUpdate, onUpdateImage, onLogout }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [address, setAddress] = useState(user.address || '');
    const [loading, setLoading] = useState(false);
    const [activeInput] = useState(new Animated.Value(0));

    // ... handleSave ...

    // ... animateInputFocus ...

    // Render logic update for avatar section
    /* 
       Note: The tool requires me to replace chunks.
       I will replace the top imports and the component definition first.
       Then I will replace the Avatar rendering part.
    */

    /* Actually I will do it in one large chunk if possible or split if needed. The start line is 3. */
    // Let's stick to doing it correctly.

    /* I'll use multi_replace for safer editing. */

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
        <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Modern Header */}
            <View style={styles.headerContainer}>
                <View style={styles.headerContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginRight: 10 }}>
                        <Text style={styles.sectionTitle}>Profile</Text>
                        {!isEditing && (
                            <TouchableOpacity
                                style={styles.smallEditButton}
                                onPress={() => {
                                    setName(user.name);
                                    setPhone(user.phone || '');
                                    setAddress(user.address || '');
                                    setIsEditing(true);
                                }}
                            >
                                <Icon name="pen" size={10} color="#fff" />
                                <Text style={styles.smallEditText}>Edit</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.sectionSubtitle}>Manage your personal information</Text>
                </View>
                <View style={styles.headerDecoration}>
                    <View style={[styles.decorationCircle, { backgroundColor: COLORS.primary + '20' }]} />
                    <View style={[styles.decorationCircle, { backgroundColor: COLORS.secondary + '20', top: 10, left: 30 }]} />
                </View>
            </View>

            {/* Profile Card with Modern Layout */}
            <View style={styles.profileCard}>
                {/* Avatar Section with Gradient Background */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.profileAvatar}>
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
                        </View>
                        {!isEditing && (
                            <View style={styles.avatarBadge}>
                                <Icon name="check-circle" size={14} color="#fff" />
                            </View>
                        )}
                    </View>

                    {!isEditing ? (
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileNameHeader}>{user.name}</Text>
                            <View style={styles.profileMeta}>
                                <Icon name="envelope" size={12} color={COLORS.secondary} />
                                <Text style={styles.profileEmailHeader}>{user.email}</Text>
                            </View>

                        </View>
                    ) : (
                        <TouchableOpacity onPress={onUpdateImage} style={styles.editAvatarNote}>
                            <Icon name="camera" size={20} color={COLORS.secondary} />
                            <Text style={styles.editAvatarText}>Tap to update photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content Area */}
                {isEditing ? (
                    <View style={styles.editForm}>
                        {/* Form with Modern Inputs */}
                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelContainer}>
                                <Icon name="user" size={14} color={COLORS.primary} />
                                <Text style={styles.inputLabel}>Full Name</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.inputWithIcon]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
                                placeholderTextColor="#999"
                                onFocus={animateInputFocus}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelContainer}>
                                <Icon name="envelope" size={14} color={COLORS.primary} />
                                <Text style={styles.inputLabel}>Email Address</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, styles.readOnlyInput]}
                                value={user.email}
                                editable={false}
                                placeholder="Email Address"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelContainer}>
                                <Icon name="phone-alt" size={14} color={COLORS.primary} />
                                <Text style={styles.inputLabel}>Phone Number</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, styles.readOnlyInput]}
                                value={phone}
                                editable={false}
                                placeholder="+1 (555) 123-4567"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.inputLabelContainer}>
                                <Icon name="map-marker-alt" size={14} color={COLORS.primary} />
                                <Text style={styles.inputLabel}>Address</Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.inputWithIcon, styles.textArea]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Enter your complete address"
                                placeholderTextColor="#999"
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
                            >
                                <Icon name="times" size={16} color={COLORS.secondary} />
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.saveButton]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <Icon name="check" size={16} color="#fff" />
                                        <Text style={styles.saveButtonText}>Save Changes</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.profileDetails}>
                        {/* Info Cards */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                                <Icon name="id-card" size={16} color={COLORS.primary} />
                                <Text style={styles.infoCardTitle}>Personal Information</Text>
                            </View>

                            <View style={styles.infoGrid}>
                                <View style={styles.infoItem}>
                                    <View style={styles.infoLabelContainer}>
                                        <Icon name="user-circle" size={14} color={COLORS.secondary} />
                                        <Text style={styles.infoLabel}>Full Name</Text>
                                    </View>
                                    <Text style={styles.infoValue}>{user.name}</Text>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoLabelContainer}>
                                        <Icon name="phone" size={14} color={COLORS.secondary} />
                                        <Text style={styles.infoLabel}>Phone</Text>
                                    </View>
                                    <Text style={[
                                        styles.infoValue,
                                        !user.phone && styles.infoValueEmpty
                                    ]}>
                                        {user.phone || 'Not set'}
                                    </Text>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoLabelContainer}>
                                        <Icon name="map-pin" size={14} color={COLORS.secondary} />
                                        <Text style={styles.infoLabel}>Address</Text>
                                    </View>
                                    <Text style={[
                                        styles.infoValue,
                                        styles.infoValueMultiline,
                                        !user.address && styles.infoValueEmpty
                                    ]}>
                                        {user.address || 'Not provided'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.infoCard}>


                            <View style={styles.infoItem}>
                                <View style={styles.infoLabelContainer}>
                                    <Icon name="envelope" size={14} color={COLORS.secondary} />
                                    <Text style={styles.infoLabel}>Email Address</Text>
                                </View>
                                <Text style={styles.infoValue}>{user.email}</Text>
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
                >
                    <Icon name="sign-out-alt" size={16} color={COLORS.danger} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            )}

            {/* Footer Note */}
            {!isEditing && (
                <View style={styles.footerNote}>
                    <Icon name="info-circle" size={14} color={COLORS.secondary} />
                    <Text style={styles.footerNoteText}>
                        Your information is secured and encrypted
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    content: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: COLORS.inputBackground,
    },
    headerContainer: {
        marginBottom: 25,
        position: 'relative',
        paddingTop: 10,
    },
    headerContent: {
        zIndex: 2,
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.dark,
        marginBottom: 5,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
        fontWeight: '500',
    },
    headerDecoration: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    decorationCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        position: 'absolute',
    },
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: COLORS.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 20,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 20,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        overflow: 'hidden', // Ensure image stays within circle
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: 'bold',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileInfo: {
        flex: 1,
    },
    profileNameHeader: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 6,
    },
    profileMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    profileEmailHeader: {
        fontSize: 14,
        color: COLORS.secondary,
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statText: {
        fontSize: 12,
        color: COLORS.dark,
        marginLeft: 6,
        fontWeight: '500',
    },
    editAvatarNote: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderWidth: 2,
        borderColor: '#f0f0f0',
        borderStyle: 'dashed',
        borderRadius: 15,
    },
    editAvatarText: {
        fontSize: 14,
        color: COLORS.secondary,
        marginTop: 10,
        fontWeight: '500',
    },
    editForm: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.dark,
        fontWeight: '600',
        marginLeft: 10,
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 2,
        borderColor: '#f0f0f0',
    },
    inputWithIcon: {
        paddingLeft: 48,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 150,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: COLORS.inputBackground,
        borderWidth: 1,
        borderColor: COLORS.secondary + '30',
    },
    cancelButtonText: {
        color: COLORS.secondary,
        fontWeight: '600',
        fontSize: 15,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    profileDetails: {
        marginTop: 10,
    },
    infoCard: {
        backgroundColor: COLORS.inputBackground,
        borderRadius: 16,
        padding: 5,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    infoCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.dark,
        marginLeft: 12,
    },
    infoGrid: {
        gap: 18,
    },
    infoItem: {
        marginBottom: 4,
    },
    infoLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '600',
        marginLeft: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.dark,
        fontWeight: '500',
        paddingLeft: 24,
    },
    infoValueMultiline: {
        lineHeight: 22,
    },
    infoValueEmpty: {
        color: '#999',
        fontStyle: 'italic',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50' + '15',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginLeft: 24,
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '600',
        marginLeft: 6,
    },
    editTriggerButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        padding: 20,
        marginTop: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    editButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    editButtonTextContainer: {
        flex: 1,
        marginHorizontal: 16,
    },
    editButtonTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    editButtonSubtitle: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
    },
    footerNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 10,
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
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginTop: 20,
        marginBottom: 10,
    },
    logoutText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    readOnlyInput: {
        backgroundColor: '#e2e8f0',
        borderColor: '#cbd5e1',
        color: '#64748b',
    },
    smallEditButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
    },
    smallEditText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default ProfileTab;