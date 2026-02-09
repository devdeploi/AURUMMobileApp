/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
    ScrollView,
    RefreshControl
} from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { APIURL, BASE_URL } from '../constants/api';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAlert from './CustomAlert';

const AdManager = ({ user }) => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: []
    });

    // Form State
    const [editingAd, setEditingAd] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [displayFrequency, setDisplayFrequency] = useState('15');

    // Date Picker State
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    useEffect(() => {
        if (user) fetchAds();
    }, [user]);

    const showAlert = (title, message, type = 'info', buttons = []) => {
        setAlertConfig({ visible: true, title, message, type, buttons });
    };

    const fetchAds = async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APIURL}/ads/my-ads`, config);
            setAds(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        fetchAds(true);
    };

    const handleImagePick = async () => {
        const options = {
            mediaType: 'photo',
            quality: 0.8,
            selectionLimit: 5, // Allow multiple TODO: Logic to limit total to 5
            maxWidth: 1024,
            maxHeight: 1024,
        };
        const result = await launchImageLibrary(options);
        if (result.assets && result.assets.length > 0) {
            // Check total limit
            if (result.assets.length + existingImages.length > 5) {
                showAlert("Limit Reached", "Max 5 images allowed total.", "warning");
                return;
            }
            setImageFiles(result.assets);
        }
    };

    const handleEditClick = (ad) => {
        setEditingAd(ad);
        setLink(ad.link || '');
        setTitle(ad.title || '');
        setDescription(ad.description || '');
        setStartDate(new Date(ad.startDate));
        setEndDate(new Date(ad.endDate));
        setDisplayFrequency(String(ad.displayFrequency || 15));
        setExistingImages(ad.imageUrls || [ad.imageUrl]);
        setImageFiles([]);
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingAd(null);
        setImageFiles([]);
        setExistingImages([]);
        setLink('');
        setTitle('');
        setDescription('');
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setDisplayFrequency('15');
    };

    const handleRemoveExistingImage = (index) => {
        const updated = existingImages.filter((_, i) => i !== index);
        setExistingImages(updated);
    };

    const handleCreateOrUpdateAd = async () => {
        if (imageFiles.length === 0 && existingImages.length === 0) {
            showAlert("Required", "Please select at least one image", "warning");
            return;
        }

        setUploading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let finalImageUrls = [...existingImages];

            // 1. Upload New Images if any
            if (imageFiles.length > 0) {
                const formData = new FormData();
                imageFiles.forEach(file => {
                    formData.append('images', {
                        uri: file.uri,
                        type: file.type || 'image/jpeg',
                        name: file.fileName || `ad_${Date.now()}.jpg`,
                    });
                });

                const uploadConfig = {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                };

                const { data: uploadedPaths } = await axios.post(`${APIURL}/upload/multiple`, formData, uploadConfig);
                finalImageUrls = [...finalImageUrls, ...uploadedPaths];
            }

            // 2. Create or Update Ad
            const adData = {
                imageUrls: finalImageUrls,
                link,
                title,
                description,
                startDate,
                endDate,
                displayFrequency: parseInt(displayFrequency) || 15
            };

            if (editingAd) {
                await axios.put(`${APIURL}/ads/${editingAd._id}`, adData, config);
                showAlert("Success", "Ad updated successfully", "success");
            } else {
                await axios.post(`${APIURL}/ads`, adData, config);
                showAlert("Success", "Ad created successfully", "success");
            }

            setShowModal(false);
            resetForm();
            fetchAds();

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.message || `Failed to ${editingAd ? 'update' : 'create'} ad`;
            showAlert("Error", errMsg, "error");
        } finally {
            setUploading(false);
        }
    };

    const handleToggleStatus = async (ad) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // Optimistic update
            const updatedAds = ads.map(a => a._id === ad._id ? { ...a, isActive: !a.isActive } : a);
            setAds(updatedAds);

            await axios.patch(`${APIURL}/ads/${ad._id}/status`, {}, config);
        } catch (err) {
            console.error(err);
            showAlert("Error", "Failed to update status", "error");
            fetchAds(); // Revert on failure
        }
    };

    const handleDelete = async (id) => {
        showAlert(
            "Delete Ad",
            "Are you sure you want to delete this ad?",
            "warning",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            const config = { headers: { Authorization: `Bearer ${user.token}` } };
                            await axios.delete(`${APIURL}/ads/${id}`, config);
                            setAds(ads.filter(a => a._id !== id));
                        } catch (err) {
                            console.error(err);
                            showAlert("Error", "Failed to delete ad", "error");
                        }
                    }
                }
            ]
        );
    };

    const onStartDateChange = (event, selectedDate) => {
        setShowStartPicker(false);
        if (selectedDate) setStartDate(selectedDate);
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndPicker(false);
        if (selectedDate) setEndDate(selectedDate);
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            {/* Show first image or carousel indicator */}
            <View>
                <Image
                    source={{ uri: `${BASE_URL}${item.imageUrls?.[0] || item.imageUrl}` }}
                    style={styles.cardImage}
                    resizeMode="cover"
                />
                {item.imageUrls?.length > 1 && (
                    <View style={styles.multiBadge}>
                        <Icon name="layer-group" size={10} color="#fff" />
                        <Text style={styles.multiText}>+{item.imageUrls.length - 1}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Untitled Ad'}
                </Text>
                {item.description ? (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={[styles.rowBetween, { marginTop: 10 }]}>
                    <View style={styles.dateBadge}>
                        <Icon name="calendar-alt" size={12} color={COLORS.secondary} />
                        <Text style={styles.dateText}>
                            {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#d1fae5' : '#f3f4f6' }]}>
                        <Text style={[styles.statusText, { color: item.isActive ? '#059669' : '#6b7280' }]}>
                            {item.isActive ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                </View>
                <View style={[styles.rowBetween, { marginTop: 8 }]}>
                    <Text style={styles.metaText}><Icon name="clock" size={10} /> {item.displayFrequency || 15} mins</Text>
                </View>
                {item.link ? (
                    <Text numberOfLines={1} style={styles.linkText}>
                        <Icon name="link" size={10} /> {item.link}
                    </Text>
                ) : null}
            </View>
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: COLORS.warning, marginRight: 10 }]}
                    onPress={() => handleEditClick(item)}
                >
                    <Text style={{ color: COLORS.warning, fontWeight: 'bold', fontSize: 12 }}>
                        Edit
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: item.isActive ? COLORS.secondary : COLORS.success }]}
                    onPress={() => handleToggleStatus(item)}
                >
                    <Text style={{ color: item.isActive ? COLORS.secondary : COLORS.success, fontWeight: 'bold', fontSize: 12 }}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: COLORS.danger, marginLeft: 10 }]}
                    onPress={() => handleDelete(item._id)}
                >
                    <Icon name="trash" size={12} color={COLORS.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Your Custom Ads</Text>
                {ads.length === 0 && (
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={() => { resetForm(); setShowModal(true); }}
                    >
                        <Icon name="plus" size={16} color="#fff" />
                        <Text style={styles.fabText}>Create Ad</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={ads}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[COLORS.secondary]}
                            tintColor={COLORS.secondary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="ad" size={40} color={COLORS.secondary} style={{ opacity: 0.5 }} />
                            <Text style={styles.emptyText}>No ads created yet.</Text>
                        </View>
                    }
                />
            )}

            {/* Create Modal */}
            <Modal visible={showModal} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingAd ? 'Edit Ad' : 'Create New Ad'}</Text>
                        <TouchableOpacity onPress={() => setShowModal(false)}>
                            <Icon name="times" size={20} color={COLORS.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* Image Picker */}
                        <Text style={styles.label}>Ad Images (Select Multiple)</Text>

                        {/* Existing Images (Edit Mode) */}
                        {existingImages.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                                {existingImages.map((url, i) => (
                                    <View key={`exist-${i}`} style={{ marginRight: 10 }}>
                                        <Image
                                            source={{ uri: `${BASE_URL}${url}` }}
                                            style={{ width: 100, height: 100, borderRadius: 10 }}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            style={{
                                                position: 'absolute', top: 0, right: 0,
                                                backgroundColor: 'red', borderRadius: 10, width: 20, height: 20,
                                                alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onPress={() => handleRemoveExistingImage(i)}
                                        >
                                            <Icon name="times" size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
                            {imageFiles.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 10 }}>
                                    {imageFiles.map((file, i) => (
                                        <Image
                                            key={i}
                                            source={{ uri: file.uri }}
                                            style={{ width: 100, height: 100, borderRadius: 10, marginRight: 10 }}
                                            resizeMode="cover"
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Icon name="images" size={30} color={COLORS.secondary} />
                                    <Text style={{ color: COLORS.secondary, marginTop: 10 }}>Tap to add new images</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Frequency */}
                        <Text style={styles.label}>Display Frequency (Minutes)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 15"
                            value={displayFrequency}
                            onChangeText={setDisplayFrequency}
                            keyboardType="numeric"
                        />

                        {/* Title */}
                        <Text style={styles.label}>Ad Title (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ad Headline"
                            value={title}
                            onChangeText={setTitle}
                        />

                        {/* Description */}
                        <Text style={styles.label}>Ad Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="Short description of the offer..."
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />


                        {/* Link */}
                        <Text style={styles.label}>Target Link (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="https://..."
                            value={link}
                            onChangeText={setLink}
                            autoCapitalize="none"
                        />

                        {/* Dates */}
                        <View style={styles.rowBetween}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>Start Date</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => setShowStartPicker(true)}>
                                    <Text style={{ color: COLORS.dark }}>{startDate.toLocaleDateString()}</Text>
                                    <Icon name="calendar" color={COLORS.secondary} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.label}>End Date</Text>
                                <TouchableOpacity style={styles.dateInput} onPress={() => setShowEndPicker(true)}>
                                    <Text style={{ color: COLORS.dark }}>{endDate.toLocaleDateString()}</Text>
                                    <Icon name="calendar" color={COLORS.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Date Pickers */}
                        {showStartPicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onStartDateChange}
                            />
                        )}
                        {showEndPicker && (
                            <DateTimePicker
                                value={endDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onEndDateChange}
                                minimumDate={startDate}
                            />
                        )}

                        <TouchableOpacity
                            style={[styles.submitBtn, uploading && { opacity: 0.7 }]}
                            onPress={handleCreateOrUpdateAd}
                            disabled={uploading}
                        >
                            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingAd ? 'Save Changes' : 'Publish Ad'}</Text>}
                        </TouchableOpacity>

                    </ScrollView>
                </View>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                buttons={alertConfig.buttons}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 169, 100, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.dark,
        letterSpacing: -0.5,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    fabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 6,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(212, 169, 100, 0.1)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardImage: {
        width: '100%',
        height: 180,
        backgroundColor: '#F1F5F9',
    },
    multiBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    multiText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        marginLeft: 4,
    },
    metaText: {
        fontSize: 12,
        color: COLORS.secondary,
        marginTop: 4,
        fontWeight: '500',
    },
    cardBody: {
        padding: 16,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    cardDescription: {
        fontSize: 14,
        color: COLORS.secondary,
        lineHeight: 20,
        marginBottom: 4,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(212, 169, 100, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 8,
    },
    dateText: {
        fontSize: 11,
        color: COLORS.dark,
        fontWeight: '600',
        marginLeft: 6,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    linkText: {
        marginTop: 10,
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
    },
    cardFooter: {
        padding: 16,
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        flexWrap: 'wrap',
    },
    actionBtn: {
        borderWidth: 1.5,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 80,
        marginVertical: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        color: COLORS.secondary,
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'ios' ? 50 : 0,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(212, 169, 100, 0.15)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.dark,
        letterSpacing: -0.5,
    },
    modalContent: {
        padding: 20,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.dark,
        marginBottom: 8,
        marginTop: 20,
        letterSpacing: -0.2,
    },
    input: {
        borderWidth: 1,
        borderColor: 'rgba(212, 169, 100, 0.2)',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.dark,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    imagePicker: {
        minHeight: 160,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(212, 169, 100, 0.3)',
        borderStyle: 'dashed',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212, 169, 100, 0.2)',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 16,
        marginTop: 32,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    submitBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    }
});

export default AdManager;
