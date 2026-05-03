import { createSlice } from '@reduxjs/toolkit';
import {
  getActividadAbiertaGuardada,
  guardarActividadAbierta,
  limpiarActividadAbierta,
} from "../../utils/actividadAbiertaStorage";

const actividadAbiertaGuardada = getActividadAbiertaGuardada();

const initialState = {
  listaActiva: actividadAbiertaGuardada?.listaActiva || null,
  historialId: actividadAbiertaGuardada?.historialId || null,
};

const listasSlice = createSlice({
  name: 'listas',
  initialState,
  reducers: {
    setListaActiva: (state, action) => {
      state.listaActiva = action.payload;
      if (state.listaActiva && state.historialId) {
        guardarActividadAbierta({
          listaActiva: state.listaActiva,
          historialId: state.historialId,
        });
      }
    },
    borrarListaActiva: (state) => {
      state.listaActiva = null;
      limpiarActividadAbierta();
    },
    setHistorialId: (state, action) => {
      state.historialId = action.payload;
      if (state.listaActiva && state.historialId) {
        guardarActividadAbierta({
          listaActiva: state.listaActiva,
          historialId: state.historialId,
        });
      }
    },
    borrarHistorialId: (state) => {
      state.historialId = null;
      limpiarActividadAbierta();
    },
  },
});

export const { setListaActiva, borrarListaActiva, setHistorialId, borrarHistorialId } = listasSlice.actions;

export default listasSlice.reducer;
