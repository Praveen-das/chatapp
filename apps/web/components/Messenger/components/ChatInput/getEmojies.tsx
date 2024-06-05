"use server";

export async function getEmojies() {
    return await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data/sets/15/native.json').then(res => res.json());
    // return await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data/sets/15/google.json').then(res => res.json());
}
