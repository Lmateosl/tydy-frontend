import { createSlice } from '@reduxjs/toolkit';

if (typeof window !== 'undefined') {
  window.localStorage.removeItem('listaActiva');
  window.localStorage.removeItem('historialId');
}

const initialState = {
  listaActiva: null,
  historialId: null,
};

const listasSlice = createSlice({
  name: 'listas',
  initialState,
  reducers: {
    setListaActiva: (state, action) => {
      state.listaActiva = action.payload;
    },
    borrarListaActiva: (state) => {
      state.listaActiva = null;
    },
    setHistorialId: (state, action) => {
      state.historialId = action.payload;
    },
    borrarHistorialId: (state) => {
      state.historialId = null;
    },
  },
});

export const { setListaActiva, borrarListaActiva, setHistorialId, borrarHistorialId } = listasSlice.actions;

export default listasSlice.reducer;
