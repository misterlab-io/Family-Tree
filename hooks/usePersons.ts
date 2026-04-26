"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPersons,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  uploadPersonPhoto,
} from "@/lib/db/persons";
import type { PersonInsert, PersonUpdate } from "@/lib/types";

export const PERSONS_KEY = (userId: string) => ["persons", userId] as const;

export function usePersons(userId: string) {
  return useQuery({
    queryKey: PERSONS_KEY(userId),
    queryFn: () => getPersons(userId),
    enabled: !!userId,
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => getPerson(id),
    enabled: !!id,
  });
}

export function useCreatePerson(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      photoFile,
    }: {
      input: PersonInsert;
      photoFile?: File;
    }) =>
      createPerson(userId, input).then(async (person) => {
        if (photoFile) {
          const photoUrl = await uploadPersonPhoto(userId, person.id, photoFile);
          return updatePerson(person.id, { photo_url: photoUrl });
        }
        return person;
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERSONS_KEY(userId) }),
  });
}

export function useUpdatePerson(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
      photoFile,
    }: {
      id: string;
      input: PersonUpdate;
      photoFile?: File;
    }) =>
      (async () => {
        let update = input;
        if (photoFile) {
          const photoUrl = await uploadPersonPhoto(userId, id, photoFile);
          update = { ...input, photo_url: photoUrl };
        }
        return updatePerson(id, update);
      })(),
    onSuccess: (person) => {
      qc.invalidateQueries({ queryKey: PERSONS_KEY(userId) });
      qc.invalidateQueries({ queryKey: ["person", person.id] });
    },
  });
}

export function useDeletePerson(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PERSONS_KEY(userId) }),
  });
}
