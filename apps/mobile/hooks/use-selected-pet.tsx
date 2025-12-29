import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAllPets, getSelectedPetId, setSelectedPetId } from '../services';
import type { Pet } from '../services';

interface PetContextValue {
    selectedPetId: string | null;
    selectedPet: Pet | null;
    allPets: Pet[];
    loading: boolean;
    changePet: (petId: string) => Promise<void>;
    refreshPets: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | undefined>(undefined);

interface PetProviderProps {
    children: ReactNode;
}

export function PetProvider({ children }: PetProviderProps) {
    const [selectedPetId, setSelectedPetIdState] = useState<string | null>(null);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [allPets, setAllPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPets = useCallback(async () => {
        try {
            const pets = await getAllPets();
            setAllPets(pets);

            const petId = await getSelectedPetId();

            // Check if selected pet still exists in active pets
            const pet = pets.find(p => p.id === petId);

            if (!pet && pets.length > 0) {
                // Selected pet was deleted, switch to first available pet
                const firstPet = pets[0];
                await setSelectedPetId(firstPet.id);
                setSelectedPetIdState(firstPet.id);
                setSelectedPet(firstPet);
            } else {
                setSelectedPetIdState(petId);
                setSelectedPet(pet || null);
            }
        } catch (error) {
            console.error('Error loading pets:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPets();
    }, [loadPets]);

    const changePet = useCallback(async (petId: string) => {
        try {
            await setSelectedPetId(petId);
            setSelectedPetIdState(petId);

            const pet = allPets.find(p => p.id === petId);
            setSelectedPet(pet || null);
        } catch (error) {
            console.error('Error changing pet:', error);
        }
    }, [allPets]);

    const refreshPets = useCallback(async () => {
        await loadPets();
    }, [loadPets]);

    const value: PetContextValue = {
        selectedPetId,
        selectedPet,
        allPets,
        loading,
        changePet,
        refreshPets,
    };

    return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function useSelectedPet() {
    const context = useContext(PetContext);
    if (context === undefined) {
        throw new Error('useSelectedPet must be used within a PetProvider');
    }
    return context;
}
