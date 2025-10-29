<template>
  <div class="app">
    <div class="sidebar">
      <Panel header="Налаштування">
        <!-- <div class="store-actions">
          <Button
            label="Зберегти в сховище"
            severity="info"
            @click="saveToLocalStorage"
          />

          <Button
            label="Очистити кеш"
            severity="danger"
            @click="clearLocalStorage"
          />
        </div> -->

        <Vue3Dropzone v-model="files" ref="dropzone" :showSelectButton="false">
          <template #title>
            <h3 class="dropzone-title">Перетягніть файли сюди</h3>
          </template>
          <template #description>
            <p class="dropzone-description">Перетягніть файли сюди або натисніть, щоб вибрати</p>
          </template>
        </Vue3Dropzone>

        <div class="save-icon">
          <Button
            v-if="files.length"
            icon="pi pi-bookmark"
            severity="secondary"
            aria-label="Bookmark"
            @click="saveIcon"
          />
        </div>

        <div class="marker-icons">
          <Button
            v-for="(icon, index) in icons"
            :key="index"
            :variant="selectedIcon === index ? 'outlined' : 'text'"
            class="!border-2"
            width="32"
            height="32"
            @click="
              selectedIcon === index
                ? (selectedIcon = null)
                : (selectedIcon = index)
            "
          >
            <img :src="icon.src" width="32" height="32" />
          </Button>
        </div>
      </Panel>
    </div>

    <div class="content">
      <Panel header="Мапа">
        <template #default>
          <GoogleMap
            api-key="AIzaSyDL9yegYAMfZbqGrc1UTLmMBZAF6yYK1Ug"
            map-id="bf8ba741171ce6ac515c5886"
            style="width: 100%; height: 500px"
            :center="center"
            :zoom="15"
            :options="mapOptions"
            @click="handleMapClick"
          >
            <AdvancedMarker
              v-for="(marker, index) in markers"
              :key="index"
              :options="{
                gmpDraggable: true,
                position: marker,
              }"
              @click="markerClick(index)"
              @dragend="onMarkerDragEnd($event, index)"
            >
              <template #content>
                <div
                  class="custom-marker"
                  :class="{
                    active:
                      activeMarkerIndex === index && activeMode === 'edit',
                  }"
                >
                  <div
                    class="custom-marker-label"
                    @click="markerLabelClick(index)"
                  >
                    {{ marker.label }}
                  </div>

                  <img
                    v-if="marker.url"
                    :src="marker.url"
                    :style="{ transform: `rotate(${marker.rotation}deg)` }"
                    class="custom-marker-icon"
                    width="32"
                    height="32"
                  />
                </div>
                <div
                  class="rotate-handle"
                  @mousedown.stop.prevent="startRotation($event, index)"
                ></div>
              </template>
            </AdvancedMarker>
          </GoogleMap>
        </template>

        <template #icons>
          <div class="rotation-slider">
            <Slider
              v-if="activeMode === 'edit' && activeMarkerIndex !== null"
              v-model="slider"
              :step="1"
              :min="0"
              :max="360"
              @update:modelValue="sliderOnChange"
            />
          </div>
        </template>
      </Panel>

      <Panel header="Дії з мітками">
        <div class="actions">
          <div class="actions-wrapper">
            <Button
              :label="activeMode === 'add' ? 'Скасувати' : 'Режим додавання'"
              :severity="activeMode === 'add' ? 'secondary' : 'success'"
              @click="
                activeMode === 'add'
                  ? (activeMode = null)
                  : (activeMode = 'add')
              "
            />

            <Button
              :label="activeMode === 'edit' ? 'Скасувати' : 'Режим редагування'"
              :severity="activeMode === 'edit' ? 'secondary' : 'warn'"
              @click="editModeToggle"
            />

            <Button
              :label="activeMode === 'delete' ? 'Скасувати' : 'Режим видалення'"
              :severity="activeMode === 'delete' ? 'secondary' : 'danger'"
              @click="
                activeMode === 'delete'
                  ? (activeMode = null)
                  : (activeMode = 'delete')
              "
            />
          </div>

          <Button label="Очистити" severity="danger" @click="clearMarkers" />
        </div>
      </Panel>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { GoogleMap, AdvancedMarker } from "vue3-google-map";

import Panel from "primevue/panel";
import Button from "primevue/button";
import Slider from "primevue/slider";
import Popover from "primevue/popover";

const center = { lat: 50.450001, lng: 30.523333 };

// const iconsFromStorage = JSON.parse(localStorage.getItem("icons")) || [];
// const markersFromStorage = JSON.parse(localStorage.getItem("markers")) || [];

const files = ref([]);
const icons = ref([]);
const slider = ref(0);
const dropzone = ref();
const markers = ref([]);
const activeMode = ref(null);
const selectedIcon = ref(null);
const activeMarkerIndex = ref(null);

const mapOptions = computed(() => ({
  draggable: true,
  disableDoubleClickZoom: false,
}));

const handleMapClick = (event) => {
  if (activeMode.value !== "add" || selectedIcon.value === null) return;

  const { latLng } = event;

  markers.value.push({
    lat: latLng.lat(),
    lng: latLng.lng(),
    label: `Мітка ${markers.value.length + 1}`,
    url:
      selectedIcon.value !== null ? icons.value[selectedIcon.value].src : null,
    rotation: 0,
  });
};

const editMarker = () => {
  const newLabel = prompt(
    "Введіть нову назву мітки:",
    markers.value[activeMarkerIndex.value].label
  );
  if (newLabel !== null) {
    markers.value[activeMarkerIndex.value].label = newLabel;
  }
};

const removeMarker = () => {
  if (activeMarkerIndex.value !== null) {
    markers.value.splice(activeMarkerIndex.value, 1);
    activeMarkerIndex.value = null;
  }
};

const clearMarkers = () => {
  markers.value = [];
};

const markerLabelClick = (index) => {
  activeMarkerIndex.value = index;

  if (activeMode.value === "edit") {
    editMarker();
  }
};

const markerClick = (index) => {
  activeMarkerIndex.value = index;

  if (activeMode.value === "edit") {
    slider.value = markers.value[index].rotation;
  }

  if (activeMode.value === "delete") {
    removeMarker();
  }
};

const saveIcon = () => {
  icons.value.push({ src: URL.createObjectURL(files.value[0].file) });

  dropzone.value.clearAll();
};

const onMarkerDragEnd = (event, index) => {
  const pos = event.latLng;
  if (!pos) return;
  markers.value[index].lat = pos.lat();
  markers.value[index].lng = pos.lng();
};

const rotateMarkers = () => {
  markers.value.forEach((marker) => {
    marker.rotate = Math.floor(Math.random() * 360);
  });

  console.log("Markers rotated:", markers.value);
};

const sliderOnChange = () => {
  if (activeMarkerIndex.value !== null) {
    markers.value[activeMarkerIndex.value].rotation = slider.value;
  }
};

// const saveToLocalStorage = () => {
//   localStorage.setItem("icons", JSON.stringify(icons.value));
//   localStorage.setItem("markers", JSON.stringify(markers.value));

//   alert("Дані збережено в локальне сховище!");
// };

// const clearLocalStorage = () => {
//   localStorage.removeItem("icons");
//   localStorage.removeItem("markers");

//   window.location.reload();
// };

const editModeToggle = () => {
  if (activeMode.value === "edit") {
    activeMode.value = null;
    activeMarkerIndex.value = null;
  } else {
    activeMode.value = "edit";
  }
};
</script>

<style scoped>
.app {
  display: flex;
  column-gap: 24px;
}

.sidebar {
  width: 30%;
  height: 100%;
}

.content {
  width: 70%;
  display: flex;
  flex-direction: column;
  row-gap: 16px;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.actions-wrapper {
  display: flex;
  gap: 8px;
}

.save-icon {
  margin: 16px 0;
  display: flex;
  justify-content: center;
}

.marker-icons {
  display: flex;
  gap: 8px;
}

.rotation-slider {
  width: 200px;
}

.store-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dropzone-title {
  margin: 8px 0;
}

.dropzone-description {
  margin: 0;
  font-size: 12px;
  color: #bebfc3;
}
</style>
