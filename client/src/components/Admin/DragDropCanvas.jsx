import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  ELEMENT: 'element',
  NEW_ELEMENT: 'new_element',
};

const DraggableElement = ({ element, onUpdate, onDelete }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ELEMENT,
    item: { id: element.id, x: element.x, y: element.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        ...styles.element,
        left: element.x,
        top: element.y,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
      }}
    >
      <div style={styles.elementContent}>
        {element.type === 'text' && (element.content || 'Texte')}
        {element.type === 'image' && '🖼️'}
        {element.type === 'rectangle' && '▭'}
      </div>
      <button
        onClick={() => onDelete(element.id)}
        style={styles.deleteBtn}
      >
        ×
      </button>
    </div>
  );
};

const NewElementButton = ({ type, label, icon }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.NEW_ELEMENT,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        ...styles.newElementButton,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span style={styles.elementIcon}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

const Canvas = ({ elements, onDrop, onUpdate, onDelete }) => {
  const [, drop] = useDrop({
    accept: [ItemTypes.ELEMENT, ItemTypes.NEW_ELEMENT],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = document.getElementById('canvas').getBoundingClientRect();
      const x = offset.x - canvasRect.left;
      const y = offset.y - canvasRect.top;

      if (item.type) {
        // New element
        onDrop(item.type, x, y);
      } else {
        // Existing element
        onUpdate(item.id, { x, y });
      }
    },
  });

  return (
    <div
      id="canvas"
      ref={drop}
      style={styles.canvas}
    >
      {elements.map((element) => (
        <DraggableElement
          key={element.id}
          element={element}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
      <div style={styles.canvasInfo}>
        Glissez-déposez des éléments ici (210mm × 297mm - A4)
      </div>
    </div>
  );
};

const DragDropCanvas = ({ initialConfig, onSave }) => {
  const [elements, setElements] = useState(initialConfig.elements || []);
  const [nextId, setNextId] = useState(
    (initialConfig.elements?.length || 0) + 1
  );

  const handleDrop = (type, x, y) => {
    const newElement = {
      id: `element-${nextId}`,
      type,
      x,
      y,
      width: '100px',
      height: 'auto',
      content: type === 'text' ? 'Nouveau texte' : '',
      fontSize: 14,
      fontWeight: 'normal',
      color: '#000',
    };

    setElements([...elements, newElement]);
    setNextId(nextId + 1);
  };

  const handleUpdate = (id, updates) => {
    setElements(
      elements.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const handleDelete = (id) => {
    setElements(elements.filter((el) => el.id !== id));
  };

  const handleSave = () => {
    const config = { elements };
    onSave(config);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={styles.container}>
        <div style={styles.toolbar}>
          <h3 style={styles.toolbarTitle}>Éléments</h3>
          <NewElementButton type="text" label="Texte" icon="T" />
          <NewElementButton type="image" label="Image" icon="🖼️" />
          <NewElementButton type="rectangle" label="Rectangle" icon="▭" />
        </div>
        <div style={styles.mainArea}>
          <Canvas
            elements={elements}
            onDrop={handleDrop}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
          <div style={styles.saveContainer}>
            <button onClick={handleSave} style={styles.saveButton}>
              Enregistrer le template
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

const styles = {
  container: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  toolbar: {
    width: '200px',
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
  },
  toolbarTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
  },
  newElementButton: {
    padding: '12px',
    marginBottom: '10px',
    backgroundColor: 'white',
    border: '2px dashed #4CAF50',
    borderRadius: '5px',
    cursor: 'move',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  elementIcon: {
    fontSize: '18px',
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflow: 'auto',
  },
  canvas: {
    position: 'relative',
    width: '794px', // A4 width in pixels at 96 DPI
    height: '1123px', // A4 height in pixels at 96 DPI
    backgroundColor: 'white',
    border: '2px solid #ddd',
    margin: '0 auto',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  canvasInfo: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#ccc',
    fontSize: '14px',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  element: {
    position: 'absolute',
    padding: '8px',
    backgroundColor: '#e3f2fd',
    border: '1px solid #2196F3',
    borderRadius: '3px',
    minWidth: '80px',
    minHeight: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elementContent: {
    flex: 1,
    fontSize: '14px',
  },
  deleteBtn: {
    width: '20px',
    height: '20px',
    border: 'none',
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '1',
    marginLeft: '5px',
  },
  saveContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default DragDropCanvas;
