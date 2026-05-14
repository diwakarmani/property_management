import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, typography } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';

type Props = {
    label: string;
    control: Control<any>;
    errors: FieldErrors<any>;
};

const DocumentPickerInput = ({ label, control, errors }: Props) => {
    return (

        <Controller
            control={control}
            name="certificationDocument"
            render={({ field: { onChange, value } }) => (
                <View style={styles.container}>
                    {label && <Text style={styles.label}>{label}</Text>}
                    <TouchableOpacity
                        style={styles.documentPickerButton}
                        onPress={async () => {
                            const result = await DocumentPicker.getDocumentAsync({
                                type: ['application/pdf', 'image/png', 'image/jpeg'],
                                copyToCacheDirectory: true,
                            });

                            if (!result.canceled) {
                                // result.assets[0] contains:
                                // { uri, name, size, mimeType }
                                onChange(result.assets[0]);
                            }
                        }}

                    >
                        <MaterialIcons name='upload' color={colors.darkGray} size={20} />
                        <View style={styles.documentValueContainer}>
                            <Text style={{
                                fontSize: typography.fontSize.xs
                            }}>
                                {value?.name
                                    ? value.name
                                    : 'Tap to upload license or certification'}
                            </Text>
                            {value?.name && <TouchableOpacity onPress={() => onChange('')}>
                                <MaterialIcons name='close' color={colors.error} size={20} />
                            </TouchableOpacity>}
                        </View>
                    </TouchableOpacity>

                    {errors.certificationDocument && (
                        <Text style={{ color: 'red', marginTop: 4 }}>
                            {errors.certificationDocument.message as string}
                        </Text>
                    )}
                </View>
            )}
        />
    );
};
const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: typography.fontSize.sm,
        color: colors.text,
        marginBottom: spacing.xs,
        fontWeight: typography.fontWeight.medium,
    },
    documentPickerButton: {
        borderWidth: 1,
        borderColor: colors.darkGray,
        borderStyle: 'dashed',
        padding: 12,
        borderRadius: 8,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,

    },
    documentValueContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    }
})
export default DocumentPickerInput;